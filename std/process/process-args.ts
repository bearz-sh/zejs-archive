import { isUpperCharAt } from "../char/mod.ts";
import { ArgumentError } from "../errors/mod.ts";

const collapseArgs = (parameters: IArguments): string[] => {
    if (parameters === undefined || parameters.length === 0) {
        return [];
    }
    if (parameters.length === 1 && Array.isArray(parameters[0])) {
        return parameters[0];
    }

    return [...parameters] as string[];
};

export function splitArguments(value: string): string[] {
    enum Quote {
        None = 0,
        Single = 1,
        Double = 2,
    }

    let token = '';
    let quote = Quote.None;
    const tokens = [];

    for (let i = 0; i < value.length; i++) {
        const c = value[i];

        if (quote > Quote.None) {
            if (quote === Quote.Single && c === '\'') {
                quote = Quote.None;
                tokens.push(token);
                token = '';
                continue;
            } else if (quote === Quote.Double && c === '"') {
                quote = Quote.None;
                tokens.push(token);
                token = '';
                continue;
            }

            token += c;
            continue;
        }

        if (c === ' ') {
            const remaining = (value.length - 1) - i;
            if (remaining > 2) {
                // if the line ends with characters that normally allow for scripts with multiline
                // statements, consume token and skip characters.
                // ' \\\n'
                // ' \\\r\n'
                // ' `\n'
                // ' `\r\n'
                const j = value[i + 1];
                const k = value[i + 2];
                if (j === '\'' || j === '`') {
                    if (k === '\n') {
                        i += 2;
                        if (token.length > 0) {
                            tokens.push(token);
                        }
                        token = '';
                        continue;
                    }

                    if (remaining > 3) {
                        const l = value[i + 3];
                        if (k === '\r' && l === '\n') {
                            i += 3;
                            if (token.length > 0) {
                                tokens.push(token);
                            }
                            token = '';
                            continue;
                        }
                    }
                }
            }

            if (token.length > 0) {
                tokens.push(token);
                token = '';
            }
            continue;
        }

        if (token.length === 0) {
            if (c === '\'') {
                quote = Quote.Single;
                continue;
            }
            if (c === '"') {
                quote = Quote.Double;
                continue;
            }
        }

        token += c;
    }

    if (token.length > 0) {
        tokens.push(token);
    }

    return tokens;
}

interface Test extends Record<string, unknown> {
    key: string 
}


export interface IArgsConversionOptions {
    prefix?: string
    exclude?: string[]
    map?: Record<string, string>
    transformKey?: (key: string) => string
    prepend?: string[]
    append?: string[]
    concatArgs?: string[]
    concatDelimiter?: string
}

export function convertToArgs(obj: Record<string, unknown>, options? : IArgsConversionOptions): ProcessArgs {
    const args = new ProcessArgs();
    const o = options || {};
    
    const append: string[] = [];
    const prepend: string[] = [];
    const prefix = o.prefix || "--";
    const concatArgs = o?.concatArgs || [];
    let transformKey = o?.transformKey;
    if(!transformKey)
    {
        transformKey = (key) => {
            let sb = "";
            for(let i = 0; i < key.length; i++)
            {
                if(isUpperCharAt(key, i))
                {
                    sb += "-";
                    sb += key[i].toLowerCase();
                    continue;
                }

                sb += key[i];
            }

            return sb;
        }
    }

    for(const key in obj)
    {
        let name = key;
        const v = obj[key];
        if(v === undefined || v === null)
            continue;

        if(o)
        {
            if(o.exclude && o.exclude.includes(key))
                continue;

            if(o.append && o.append.includes(key))
            {
                args.append(v.toString());
                continue;
            }

            if(o.prepend && o.prepend.includes(key))
            {
                prepend.push(v.toString());
                continue;
            }
            
            if(o.map && o.map[key])
            {
                name = o.map[key];
            }
        }

        name = transformKey(name);

        name = prefix + name;

        if(typeof v === "boolean")
        {
            if(v)
                args.append(name);
            continue;
        }

        if(Array.isArray(v))
        {
            if(concatArgs.includes(key))
            {
                args.append(name);
                args.append(v.join(o?.concatDelimiter || ","));
                continue;
            }
            
            for(const item of v)
            {
                args.append(name);
                args.append(item.toString());
            }
        }

        if(typeof v === "string")
        {
            args.append(name);
            args.append(v);
            continue;
        }

        if(typeof v === "number")
        {
            args.append(name);
            args.append(v.toString());
            continue;
        }
    }

    if(append.length > 0)
        args.unshift(...append);

    if(prepend.length > 0)
        args.push(...prepend);

    return args;
}

export class ProcessArgs extends Array<string> {
    constructor(args: string[]);
    constructor(...args: string[]);
    constructor() {
        super(...collapseArgs(arguments));
    }

    append(value: string): ProcessArgs;
    append(...args: string[]): ProcessArgs;
    append(value: ProcessArgs): ProcessArgs;
    append() {
        if (arguments.length === 1) {
            const first = arguments[0];
            if (typeof first === 'string') {
                const args = splitArguments(first);
                super.push(...args);
                return this;
            }

            if (first instanceof ProcessArgs) {
                super.push(...first);
                return this;
            }


            if (Array.isArray(first)) {
                this.push(...first);
                return this;
            }

            if (Object.prototype.toString.call(first) === '[object Object]') {
                Object.keys(first).forEach((key) => {
                    super.push(key);
                    super.push(first[key]);
                });

                return this;
            }

            throw new TypeError(`Cannot convert ${first} to ProcessArgs`);
        }

        throw new ArgumentError(
            `ProcessArgs.from() takes 1 argument, but got ${arguments.length}`,
        );
    }

    override push(...args: string[]) {
        let count = 0;
        args.forEach((arg) => {
            const next = splitArguments(arg);
            count += super.push(...next);
        });

        return count;
    }

    static convert(args?: unknown, options?: IArgsConversionOptions): ProcessArgs {
        if(args === undefined || args === null)
            return new ProcessArgs();
        
        if(args instanceof ProcessArgs)
            return args;
        
        if(Array.isArray(args)) {
            return new ProcessArgs().append(...args);
        }

        if(typeof args === "string") {
            return new ProcessArgs().append(args);
        }

        if(typeof args === "object")
            return convertToArgs(args as Record<string, unknown>, options);

        throw new TypeError(`Cannot convert ${args} to ProcessArgs`);
    }

    static from(value: string): ProcessArgs;
    static from(...args: string[]): ProcessArgs;
    static from(value: ProcessArgs): ProcessArgs;
    static from(): ProcessArgs {
        return new ProcessArgs().append(...arguments);
    }
}