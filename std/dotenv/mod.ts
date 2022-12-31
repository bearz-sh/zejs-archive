// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * Configure environmental variables using `.env` files.
 *
 * @module
 */

import { get, set,toObject, expand as expand2 } from '../env/mod.ts';
import { FileNotFoundError, readFile, readFileAsync, readTextFile, readTextFileAsync, writeTextFile, writeTextFileAsync } from '../fs/mod.ts';
import { difference, removeEmptyValues } from './util.ts';

export interface DotenvConfig {
    [key: string]: string;
}

export interface ConfigOptions {
    path?: string;
    export?: boolean;
    safe?: boolean;
    example?: string;
    allowEmptyValues?: boolean;
    defaults?: string;
}

type LineParseResult = {
    key: string;
    unquoted: string;
    interpolated: string;
    notInterpolated: string;
};

type CharactersMap = { [key: string]: string };

export function parse(rawDotenv: string, expandVars = true): DotenvConfig {
    // TODO: separate out a tokenizer and parser.
    const env: DotenvConfig = {};

    enum Quotes {
        single = '\'',
        double = '"',
        backtick = '`',
        json = '{'
    }

    let inQuote = false;
    let quote: Quotes = Quotes.double;
    let key = "";
    let value = "";
    let inKey = true;
    let inComment = false;
    for(let i = 0; i < rawDotenv.length; i++) {
        const c = rawDotenv[i];
        
        if(inComment) {
            if(c == '\n') {
                inComment = false;
                inKey = true;
                continue;
            }

            continue;
        }

        if(inKey) {
            if(c === '#') {
                inComment = true;
                key = "";
                value = "";
                continue;
            }

            if(key.length == 0 && c === ' ') {
                continue;
            }

            if(c === '\n') {
    
                key = "";
                value = "";
                continue;
            }

            // assignment, switch to value
            if(c === '=') {
                inKey = false;
                continue;
            }

            const p = c.codePointAt(0) || -1;
            if((p > 64 && p < 91) || (p > 96 && p < 122) || p == 95) {
                key += c;
                continue;
            }

            if(c !== ' ') {
                throw new Error(`Invalid character ${c} in key ${key}`);
            }

            continue;
        }

       
        if(!inQuote) {
            if(value.length === 0) {
                if (c === Quotes.single) {
                    quote = Quotes.single;
                    inQuote = true;
                    continue;
                }

                if (c === Quotes.double) {
                    quote = Quotes.double;
                    inQuote = true;
                    continue;
                }

                if (c === Quotes.backtick) {
                    quote = Quotes.backtick
                    inQuote = true;
                    continue;
                }

                if (c === Quotes.json) {
                    quote = Quotes.json
                    inQuote = true;
                    value += "{"
                    continue;
                }

                if (c === ' ') {
                    continue;
                }
            }

            if (c === '\n') {
                inKey = true;
                env[key] = value.trim();
                key = "";
                value = "";
                continue;
            }

            if (c === '#') {
                env[key] = value.trim();
                key = "";
                value = "";
                inComment = true;
                continue;
            }

            value += c;
        } else {
            switch(quote) {
                case Quotes.double:
                    if (c === Quotes.double) {
                        inQuote = false;
                        inKey = true;
                        env[key] = value;
                        key = "";
                        value = "";
                        let n = i++;
                        while (n < rawDotenv.length) {
                            const nc = rawDotenv[n];
                            if (nc === '\n') {
                                inKey = true;
                                break;
                            }

                            n = i++;
                        }
                        continue;
                    }

                    value += c;
                    break;
                case Quotes.single:
                    if (c === Quotes.single) {
                        inQuote = false;
                        inKey = true;
                        env[key] = value;
                        key = "";
                        value = "";
                        // fast forward to end of line
                        let n = i++;
                        while (n < rawDotenv.length) {
                            const nc = rawDotenv[n];
                            if (nc === '\n') {
                                inKey = true;
                                break;
                            }

                            n = i++;
                        }
                        continue;
                    }

                    value += c;

                    break;

                case Quotes.backtick:
                    if (c === Quotes.backtick) {
                        inQuote = false;
                        inKey = true;
                        env[key] = value;
                        key = "";
                        value = "";
                        // fast forward to end of line
                        let n = i++;
                        while (n < rawDotenv.length) {
                            const nc = rawDotenv[n];
                            if (nc === '\n') {
                                inKey = true;
                                break;
                            }

                            n = i++;
                        }

                        continue;
                    }

                    value += c;
                    break;

                case Quotes.json:
                    if (c === '}') {
                        inQuote = false;
                        inKey = true;
                        value += "}";
                        env[key] = value;
                        key = "";
                        value = "";
                        // fast forward to end of line
                        let n = i++;
                        while (n < rawDotenv.length) {
                            const nc = rawDotenv[n];
                            if (nc === '\n') {
                                inKey = true;
                                break;
                            }

                            n = i++;
                        }
                        continue;
                    }
                    value += c;

                    break;

                default: 
                    value += c;
                    break;
            }
        }
    }
   
    if(expandVars) {
        //https://github.com/motdotla/dotenv-expand/blob/ed5fea5bf517a09fd743ce2c63150e88c8a5f6d1/lib/main.js#L23
        const variablesMap = { ...env, ...toObject() };
        Object.keys(env).forEach((key) => {
            const v = env[key];
            if(!v.includes("$"))
                return;

            env[key] = expand(v, variablesMap);
        });
    }

    return env;
}

const defaultConfigOptions = {
    path: `.env`,
    export: false,
    safe: false,
    example: `.env.example`,
    allowEmptyValues: false,
    defaults: `.env.defaults`,
};

export function config(options: ConfigOptions = {}): DotenvConfig {
    const o: Required<ConfigOptions> = { ...defaultConfigOptions, ...options };

    const conf = parseFile(o.path);

    if (o.defaults) {
        const confDefaults = parseFile(o.defaults);
        for (const key in confDefaults) {
            if (!(key in conf)) {
                conf[key] = confDefaults[key];
            }
        }
    }

    if (o.safe) {
        const confExample = parseFile(o.example);
        assertSafe(conf, confExample, o.allowEmptyValues);
    }

    if (o.export) {
        for (const key in conf) {
            if (get(key) !== undefined) continue;
                set(key, conf[key]);
        }
    }

    return conf;
}

export async function configAsync(
    options: ConfigOptions = {},
): Promise<DotenvConfig> {
    const o: Required<ConfigOptions> = { ...defaultConfigOptions, ...options };

    const conf = await parseFileAsync(o.path);

    if (o.defaults) {
        const confDefaults = await parseFileAsync(o.defaults);
        for (const key in confDefaults) {
            if (!(key in conf)) {
                conf[key] = confDefaults[key];
            }
        }
    }

    if (o.safe) {
        const confExample = await parseFileAsync(o.example);
        assertSafe(conf, confExample, o.allowEmptyValues);
    }

    if (o.export) {
        for (const key in conf) {
            if (get(key) !== undefined) continue;
                set(key, conf[key]);
        }
    }

    return conf;
}

function parseFile(filepath: string) {
    try {
        return parse(new TextDecoder('utf-8').decode(readFile(filepath)));
    } catch (e) {
        if (e instanceof FileNotFoundError) return {};
        throw e;
    }
}

async function parseFileAsync(filepath: string) {
    try {
        return parse(
            new TextDecoder('utf-8').decode(await readFileAsync(filepath)),
        );
    } catch (e) {
        if (e instanceof FileNotFoundError) return {};
        throw e;
    }
}

/*
function expandCharacters(str: string): string {
    const charactersMap: CharactersMap = {
        '\\n': '\n',
        '\\r': '\r',
        '\\t': '\t',
    };

    return str.replace(
        /\\([nrt])/g,
        ($1: keyof CharactersMap): string => charactersMap[$1],
    );
} */

function assertSafe(
    conf: DotenvConfig,
    confExample: DotenvConfig,
    allowEmptyValues: boolean,
) {
    const currentEnv = toObject();
    // Not all the variables have to be defined in .env, they can be supplied externally
    const confWithEnv = Object.assign({}, currentEnv, conf);

    const missing = difference(
        Object.keys(confExample),
        // If allowEmptyValues is false, filter out empty values from configuration
        Object.keys(
            allowEmptyValues ? confWithEnv : removeEmptyValues(confWithEnv),
        ),
    );

    if (missing.length > 0) {
        const errorMessages = [
            `The following variables were defined in the example file but are not present in the environment:\n  ${missing.join(
                ', ',
            )
            }`,
            `Make sure to add them to your env file.`,
            !allowEmptyValues &&
            `If you expect any of these variables to be empty, you can set the allowEmptyValues option to true.`,
        ];

        throw new MissingEnvVarsError(
            errorMessages.filter(Boolean).join('\n\n'),
            missing,
        );
    }
}

export class MissingEnvVarsError extends Error {
    missing: string[];
    constructor(message: string, missing: string[]) {
        super(message);
        this.name = 'MissingEnvVarsError';
        this.missing = missing;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

function expand(str: string, variablesMap: { [key: string]: string | undefined }): string {
    return expand2(str, false,
        (name: string) => {
            return variablesMap[name];
        }
    );
}

/**
 * @param object object to be stringified
 * @returns string of object
 * ```ts
 * import { stringify } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";
import { readTextFile, writeTextFile, writeTextFileAsync } from '../os/fs';
 *
 * const object = { GREETING: "hello world" };
 * const string = stringify(object);
 * ```
 */
export function stringify(object: DotenvConfig) {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(object)) {
        let quote;

        let escapedValue = value ?? '';
        if (key.startsWith('#')) {
            console.warn(
                `key starts with a '#' indicates a comment and is ignored: '${key}'`,
            );
            continue;
        } else if (escapedValue.includes('\n')) {
            // escape inner new lines
            escapedValue = escapedValue.replaceAll('\n', '\\n');
            quote = `"`;
        } else if (escapedValue.match(/\W/)) {
            quote = '\'';
        }

        if (quote) {
            // escape inner quotes
            escapedValue = escapedValue.replaceAll(quote, `\\${quote}`);
            escapedValue = `${quote}${escapedValue}${quote}`;
        }
        const line = `${key}=${escapedValue}`;
        lines.push(line);
    }
    return lines.join('\n');
}

export function readDotEnvFile(path: string | URL, expandVars = true) {
    const content = readTextFile(path);
    return parse(content, expandVars);
}

export async function readDotEnvFileAsync(path: string | URL, expandVars = true) {
    const content = await readTextFileAsync(path);
    return parse(content, expandVars);
}

export function writeDotEnvFile(path: string | URL, env: DotenvConfig) {
    const content = stringify(env);
    writeTextFile(path, content);
}

export async function writeDotEnvFileAsync(path: string | URL, env: DotenvConfig) {
    const content = stringify(env);
    await writeTextFileAsync(path, content);
}
