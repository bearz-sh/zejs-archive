import { basenameWithoutExtension,resolve, isAbsolute, basename, join } from "../path/mod.ts";
import  {IS_WINDOWS } from "../os/_base.ts";
import { isFile,isDirectory, isDirectoryAsync, isFileAsync } from '../fs/mod.ts'
import { split } from "../env/path.ts";
import { expand, get } from '../env/_base.ts';

const executableCache: { [key: string]: string | undefined } = {};
function isNullOrWhiteSpace(str: string) {
    return !str || str.trim().length === 0;
}
/**
 * which - Returns the full path of the executable file of the given program;
 * otherwise, returns undefined.
 *
 * @remarks The returned path is the full path of the executable file of the given program
 * if the program can be found in the system PATH environment variable or
 * using any of the paths from `prependedPaths` if specified.
 *
 * By default, `which` will cache the first lookup and then use the cache
 * for subsequent lookups unless `useCache` is set to false.
 *
 * @param {string} fileName The program file name.
 * @param {(string[] | undefined)} prependPath The paths to prepend to the PATH environment variable.
 * @param {IEnvironment} env The environment class to use to lookup environment variables. Defaults to `envDefault`.
 * @param {boolean} useCache
 * @returns {string | undefined}
 */
export function which(
    fileName: string,
    prependPath?: string[],
    useCache = true,
): string | undefined {
    if(!fileName) {
        throw new Error('fileName is required');
    }

    

    const rootName = basenameWithoutExtension(fileName);
    let location = executableCache[rootName];
    if (useCache && location !== undefined) {
        return location;
    }

    if (isAbsolute(fileName) && isFile(fileName)) {
        location = fileName;
        if (useCache) {
            executableCache[rootName] = location;
            executableCache[fileName] = location;
        }

        return location;
    }

    prependPath = prependPath?.map<string>((o) => {
        if (isAbsolute(o)) {
            return o;
        }

        return resolve(o);
    });

    const baseName = basename(fileName);
    const baseNameLowered = baseName.toLowerCase();

    const systemPaths = split()
        .filter((segment) => segment.length > 0)
        .map((segment) => expand(segment));

    const pathSegments = prependPath !== undefined ? prependPath.concat(systemPaths) : systemPaths;
    let pathExtSegments: string[] = [];

    if (IS_WINDOWS) {
        const pe = get('PATHEXT') || '';
        const pathExtensions = !isNullOrWhiteSpace(pe)
            ? pe?.toLowerCase()
            : '.com;.exe;.bat;.cmd;.vbs;.vbe;.js;.jse;.wsf;.wsh';

        pathExtSegments = pathExtensions.split(';')
            .filter((segment) => !isNullOrWhiteSpace(segment));
    }

    for (const pathSegment of pathSegments) {
        if (isNullOrWhiteSpace(pathSegment) || !isDirectory(pathSegment)) {
            continue;
        }

        if (IS_WINDOWS) {
            const hasPathExt = pathExtSegments.find((segment) =>
                fileName.toLowerCase().endsWith(segment)
            ) !== undefined;

            if (hasPathExt) {
                try {
                   
                    let first : Deno.DirEntry | undefined;
                    for(const entry of  Deno.readDirSync(pathSegment)) {
                        if(entry.isFile && entry.name?.toLowerCase() === baseNameLowered) {
                            first = entry;
                            break;
                        }
                    }

                    if (first?.name) {
                        location = join(pathSegment, first.name);
                        executableCache[rootName] = location;
                        executableCache[fileName] = location;

                        return location;
                    }
                } catch (e) {
                    // TODO: replace with debug trace writer
                    console.debug(e.toString());
                }
            } else {
                try {
                    let first : Deno.DirEntry | undefined;
                    for(const entry of Deno.readDirSync(pathSegment)) {
                        if(entry.isFile && entry.name?.toLowerCase() === baseNameLowered) {
                            first = entry;
                            break;
                        }
                    }

                    if (first?.name) {
                        location = join(pathSegment, first.name);
                        executableCache[rootName] = location;
                        executableCache[fileName] = location;

                        return location;
                    }
                } catch (e) {
                    console.debug(e.toString());
                }
            }
        } else {
            try {
                let first : Deno.DirEntry | undefined;
                for(const entry of Deno.readDirSync(pathSegment)) {
                    if(entry.isFile && entry.name?.toLowerCase() === baseNameLowered) {
                        first = entry;
                        break;
                    }
                }

                if (first?.name) {
                    location = join(pathSegment, first.name);
                    executableCache[rootName] = location;
                    executableCache[fileName] = location;

                    return location;
                }
            } catch (e) {
                console.debug(e.toString());
            }
        }
    }

    return undefined;
}


/**
 * which - Returns the full path of the executable file of the given program;
 * otherwise, returns undefined.
 *
 * @remarks The returned path is the full path of the executable file of the given program
 * if the program can be found in the system PATH environment variable or
 * using any of the paths from `prependedPaths` if specified.
 *
 * By default, `which` will cache the first lookup and then use the cache
 * for subsequent lookups unless `useCache` is set to false.
 *
 * @param {string} fileName The program file name.
 * @param {(string[] | undefined)} prependPath The paths to prepend to the PATH environment variable.
 * @param {IEnvironment} env The environment class to use to lookup environment variables. Defaults to `envDefault`.
 * @param {boolean} useCache
 * @returns {string | undefined}
 */
export async function whichAsync(
    fileName: string,
    prependPath?: string[],
    useCache = true,
): Promise<string | undefined> {
    if(!fileName) {
        throw new Error('fileName is required');
    }

    const rootName = basenameWithoutExtension(fileName);
    let location = executableCache[rootName];

    if (useCache && location !== undefined) {
        return location;
    }

    if (isAbsolute(fileName) && await isFileAsync(fileName)) {
        location = fileName;
        if (useCache) {
            executableCache[rootName] = location;
            executableCache[fileName] = location;
        }

        return location;
    }

    prependPath = prependPath?.map<string>((o) => {
        if (isAbsolute(o)) {
            return o;
        }

        return resolve(o);
    });

    const baseName = basename(fileName);
    const baseNameLowered = baseName.toLowerCase();

    const systemPaths = split()
        .filter((segment) => segment.length > 0)
        .map((segment) => expand(segment));

    const pathSegments = prependPath !== undefined ? prependPath.concat(systemPaths) : systemPaths;
    let pathExtSegments: string[] = [];

    if (IS_WINDOWS) {
        const pe = (get('PATHEXT') || '.com;.exe;.bat;.cmd;.vbs;.vbe;.js;.jse;.wsf;.wsh').toLowerCase();


        pathExtSegments = pe.split(';')
            .filter((segment) => !isNullOrWhiteSpace(segment));
    }

    for (const pathSegment of pathSegments) {
        if (isNullOrWhiteSpace(pathSegment)) {
            continue;
        }

        const isDir = await isDirectoryAsync(pathSegment);
        if (!isDir) {
            continue;
        }

        if (IS_WINDOWS) {
            const hasPathExt = pathExtSegments.find((segment) =>
                fileName.toLowerCase().endsWith(segment)
            ) !== undefined;

            if (hasPathExt) {
                try {
                   
                    let first : Deno.DirEntry | undefined;
                    for await(const entry of Deno.readDir(pathSegment)) {
                        if(entry.isFile && entry.name?.toLowerCase() === baseNameLowered) {
                            first = entry;
                            break;
                        }
                    }

                    if (first?.name) {
                        location = join(pathSegment, first.name);
                        executableCache[rootName] = location;
                        executableCache[fileName] = location;

                        return location;
                    }
                } catch (e) {
                    // TODO: replace with debug trace writer
                    console.debug(e.toString());
                }
            } else {
                try {
                    
                    let first : Deno.DirEntry | undefined;
                    for await(const entry of Deno.readDir(pathSegment)) {
                        if(entry.isFile && entry.name?.toLowerCase() === baseNameLowered) {
                            first = entry;
                            break;
                        }
                    }

                    if (first?.name) {
                        location = join(pathSegment, first.name);
                        executableCache[rootName] = location;
                        executableCache[fileName] = location;

                        return location;
                    }
                } catch (e) {
                    console.debug(e.toString());
                }
            }
        } else {
            try {
                let first : Deno.DirEntry | undefined;
                for await(const entry of Deno.readDir(pathSegment)) {
                    if(entry.isFile && entry.name?.toLowerCase() === baseNameLowered) {
                        first = entry;
                        break;
                    }
                }

                if (first?.name) {
                    location = join(pathSegment, first.name);
                    executableCache[rootName] = location;
                    executableCache[fileName] = location;

                    return location;
                }
            } catch (e) {
                console.debug(e.toString());
            }
        }
    }

    return undefined;
}

