import { fromFileUrl } from 'https://deno.land/std@0.170.0/path/mod.ts';
export * from './errors.ts'

export function isFile(file: string | URL) {
    return Deno.statSync(file).isFile;
}

export function isDirectory(file: string | URL) {
    return Deno.statSync(file).isDirectory;
}

export function isFileAsync(file: string | URL) {
    return Deno.stat(file).then(stat => stat.isFile);
}

export function isDirectoryAsync(file: string | URL) {
    return Deno.stat(file).then(stat => stat.isDirectory);
}

export interface ISystemError extends Error {
    code: string;
    address?: string;
    dest?: string;
    errno?: number;
}

export interface IDirectoryInfo {
    name: string | null;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
}

export interface IRemoveOptions {
    recursive?: boolean;
}

export interface ICreateDirectoryOptions {
    recursive?: boolean;
    mode?: number;
}

export interface ICopyOptions {
    overwrite?: boolean;
    preserveTimestamps?: boolean;
}

export interface IMoveOptions {
    overwrite?: boolean;
}

export interface IWriteOptions {
    append?: boolean;
    create?: boolean;
    signal?: AbortSignal;
    mode?: number;
}

export interface IFileInfo {
    name: string;
    deviceId: number | null;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
    size: number;
    createdAt: Date | null;
    modifiedAt: Date | null;
    lastAccessedAt: Date | null;
    userId: number | null;
    groupId: number | null;
    mode: number | null;
}

export interface IWriteJsonOptions extends IWriteOptions {
    spaces: number;
}

export function makeDirectory(
    path: string | URL,
    options?: ICreateDirectoryOptions,
): void {
    Deno.mkdirSync(path, options);
}

export async function makeDirectoryAsync(
    path: string | URL,
    options?: ICreateDirectoryOptions,
): Promise<void> {
    await Deno.mkdir(path, options);
}

export function copyFile(src: string | URL, dest: string | URL) {
    Deno.copyFileSync(src, dest);
}

export function copyFileAsync(src: string | URL, dest: string | URL) {
    return Deno.copyFile(src, dest);
}

export function exists(path: string | URL): boolean {
    try 
    {
        Deno.statSync(path);
        return true;
    } catch {
        return false;
    }
}

export async function existsAsync(path: string | URL): Promise<boolean> {
    try 
    {
        await Deno.stat(path);
        return true;
    } catch {
        return false;
    }
}


export function lstat(path: string | URL): IFileInfo {
    const stat = Deno.lstatSync(path);
    const name = path instanceof URL ? path.toString() : path;

    const fi: IFileInfo = {
        isFile: stat.isFile,
        isDirectory: stat.isDirectory,
        isSymlink: stat.isSymlink,
        size: stat.size,
        createdAt: stat.atime,
        modifiedAt: stat.mtime,
        lastAccessedAt: stat.atime,
        mode: stat.mode,
        name: name,
        userId: stat.uid,
        groupId: stat.gid,
        deviceId: stat.dev,
    };

    return fi;
}

export function lstatAsync(path: string | URL): Promise<IFileInfo> {
    return Deno.lstat(path).then(stat => {
        const name = path instanceof URL ? path.toString() : path;

        const fi: IFileInfo = {
            isFile: stat.isFile,
            isDirectory: stat.isDirectory,
            isSymlink: stat.isSymlink,
            size: stat.size,
            createdAt: stat.birthtime,

            modifiedAt: stat.mtime,
            lastAccessedAt: stat.atime,
            mode: stat.mode,
            name: name,
            userId: stat.uid,
            groupId: stat.gid,
            deviceId: stat.dev,
        };
        return fi;
    });
}

export function move(
    src: string | URL,
    dest: string |URL
): void {
    Deno.renameSync(src, dest);
}

export async function moveAsync(
    src: string,
    dest: string,

): Promise<void> {
   await Deno.rename(src, dest);
}

class DirIteratorAsync implements AsyncIterable<IDirectoryInfo> {
    private dirEntries: AsyncIterable<Deno.DirEntry>;

    constructor(dirEntries: AsyncIterable<Deno.DirEntry>) {
        this.dirEntries = dirEntries;
    }

    [Symbol.asyncIterator](): AsyncIterableIterator<IDirectoryInfo> {
        return this;
    }

    async next(): Promise<IteratorResult<IDirectoryInfo>> {
          
        // @ts-ignore - next exists, but is missing from the type definition
        const e = await this.dirEntries.next();

        if(e.done) {
            return {
                done: true,
                value: null,
            };
        }
       
        const x : IDirectoryInfo = {
            isFile: e.value.isFile,
            name: e.value.name,
            isDirectory: e.value.isDirectory,
            isSymlink: e.value.isSymlink,
        }

        return {
            done: false,
            value: x,
        };
    }
}

class DirIterator implements Iterable<IDirectoryInfo> {
    private dirEntries: Iterable<Deno.DirEntry>;

    constructor(dirEntries: Iterable<Deno.DirEntry>) {
        this.dirEntries = dirEntries;
    }

    [Symbol.iterator](): IterableIterator<IDirectoryInfo> {
        return this;
    }

    next(): IteratorResult<IDirectoryInfo> {

        // @ts-ignore - next exists, but is missing from the type definition
        const e = this.dirEntries.next();

        if(e.done) {
            return {
                done: true,
                value: null,
            };
        }
       
        const x : IDirectoryInfo = {
            isFile: e.value.isFile,
            name: e.value.name,
            isDirectory: e.value.isDirectory,
            isSymlink: e.value.isSymlink,
        }

        return {
            done: false,
            value: x,
        };
    }
}

export function readDirectory(path: string | URL): Iterable<IDirectoryInfo> {
    const dirEntries = Deno.readDirSync(path);

    return new DirIterator(dirEntries);
}

export function readDirectoryAsync(
    path: string | URL,
): AsyncIterable<IDirectoryInfo> {
    const dirEntries = Deno.readDir(path);
    return new DirIteratorAsync(dirEntries);
}

export function readFile(path: string | URL): Uint8Array {
    return Deno.readFileSync(path);
}

export function readFileAsync(path: string | URL): Promise<Uint8Array> {
    return Deno.readFile(path);
}

// deno-lint-ignore no-explicit-any
export function readJsonFile(path: string | URL): any {
    let text = readTextFile(path);
    text = text.replace(/^\ufeff/g, '');
    return JSON.parse(text);
}

// deno-lint-ignore no-explicit-any
export function readJsonFileAsync(path: string | URL): Promise<any> {
    return readTextFileAsync(path).then((text) => {
        text = text.replace(/^\ufeff/g, '');
        return JSON.parse(text);
    });
}

export function readTextFile(path: string | URL): string {
    return Deno.readTextFileSync(path);
}

export function readTextFileAsync(path: string | URL): Promise<string> {
    return Deno.readTextFile(path);
}

export function realPath(path: string | URL): string {
    return Deno.realPathSync(path);
}

export function realPathAsync(path: string | URL): Promise<string> {
    return Deno.realPath(path);
}


export function removeDirectory(
    path: string | URL,
    options?: IRemoveOptions,
): void {
    return Deno.removeSync(path, { recursive: options?.recursive }  );
}

export function removeDirectoryAsync(
    path: string | URL,
    options?: IRemoveOptions,
): Promise<void> {
    return Deno.remove(path, { recursive: options?.recursive }  );
}

export function removeFile(path: string | URL) : void {
    Deno.removeSync(path);
}

export async function removeFileAsync(path: string | URL) {
    await Deno.remove(path);
}





export function stat(path: string | URL): IFileInfo {
    const dfi = Deno.statSync(path);
    const fi: IFileInfo = {
        isFile: dfi.isFile,
        isDirectory: dfi.isDirectory,
        isSymlink: dfi.isSymlink,
        size: dfi.size,
        createdAt: dfi.birthtime,
        modifiedAt: dfi.mtime,
        lastAccessedAt: dfi.atime,
        mode: dfi.mode,
        name: path instanceof URL ? fromFileUrl(path) : path,
        userId: dfi.uid,
        groupId: dfi.gid,
        deviceId: dfi.dev,
    };

    return fi;
}

export function statAsync(path: string | URL): Promise<IFileInfo> {
    return Deno.stat(path).then((df : Deno.FileInfo) => {
        const fi: IFileInfo = {
            isFile: df.isFile,
            isDirectory: df.isDirectory,
            isSymlink: df.isSymlink,
            size: df.size,
            createdAt: df.birthtime,
            modifiedAt: df.mtime,
            lastAccessedAt: df.atime,
            mode: df.mode,
            name: path instanceof URL ? fromFileUrl(path) : path,
            userId: df.uid,
            groupId: df.gid,
            deviceId: df.dev,
        };

        return fi;
    });
}

export function writeFile(
    path: string | URL,
    data: Uint8Array,
    options?: IWriteOptions,
): void {
    Deno.writeFileSync(path, data, { append: options?.append, create: options?.create, mode: options?.mode });
}

export function writeFileAsync(
    path: string | URL,
    data: Uint8Array,
    options?: IWriteOptions,
): Promise<void> {
    return Deno.writeFile(path, data, { append: options?.append, create: options?.create, mode: options?.mode });
}

export function writeTextFile(
    path: string | URL,
    data: string,
    options?: IWriteOptions,
): void {
    Deno.writeTextFileSync(
        path, 
        data, 
        { append: options?.append, create: options?.create, mode: options?.mode });
}

export function writeTextFileAsync(
    path: string | URL,
    data: string,
    options?: IWriteOptions,
): Promise<void> {
    return Deno.writeTextFile(
        path, 
        data, 
        { append: options?.append, create: options?.create, mode: options?.mode });
}

export function writeJsonFile(
    path: string | URL,
    // deno-lint-ignore no-explicit-any
    data: any,
    options?: IWriteJsonOptions,
): void {
    const json = JSON.stringify(
        data,
        null,
        options ? options.spaces : 4,
    );
    writeTextFile(path, json, options);
}

export async function writeJsonFileAsync(
    path: string | URL,
    // deno-lint-ignore no-explicit-any
    data: any,
    options?: IWriteJsonOptions,
): Promise<void> {
    const json = JSON.stringify(data, null, options?.spaces || 4);
    await writeTextFileAsync(path, json, options);
}
