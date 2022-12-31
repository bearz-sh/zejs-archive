import { findOrThrow, findOrThrowAsync, register } from "../../std/process/finder.ts";
import { ProcessArgs, call as call2, callAsync as callAsync2, ICommandOptions, convertToArgs, ProcessResult } from "../../std/process/mod.ts";

const name = 'age';
const keygenName = 'age-keygen';

register({
    exe: name,
});

register({
    exe: keygenName,
});

function exe() {
    return findOrThrow(name);
}

function exeAsync() {
    return findOrThrowAsync(name);
}

function keygenExe() {
    return findOrThrow(keygenName);
}

function keygenExeAsync() {
    return findOrThrowAsync(keygenName);
}

export interface IAgeOptions extends Record<string, unknown>{
    decrypt?: boolean;
    encrypt?: boolean;
    identity?: string;
    output?: string;
    recipients?: string[];
    armor?: boolean;
    recipientsFile?: string[];
    input?: string;
}

export function age(cmd?: IAgeOptions, options?: ICommandOptions) : ProcessResult
export function age(cmd?: string, options?: ICommandOptions) : ProcessResult
export function age(cmd?: string[], options?: ICommandOptions): ProcessResult
export function age(cmd?: unknown, options?: ICommandOptions) : ProcessResult {
    const args = ProcessArgs.convert(cmd, {
        append: ['input']
    });
    
    const o = {
        ...options,
        args,
    }
    
    return call2(exe(), o);
}

export async function ageAsync(cmd?: IAgeOptions, options?: ICommandOptions) : Promise<ProcessResult>
export async function ageAsync(cmd?: string, options?: ICommandOptions): Promise<ProcessResult>
export async function ageAsync(cmd?: string[], options?: ICommandOptions): Promise<ProcessResult>
export async function ageAsync(cmd?: unknown, options?: ICommandOptions) {
    const args = ProcessArgs.convert(cmd, {
        append: ['input']
    });

    const o = {
        ...options,
        args,
    }
    
    return await callAsync2(await exeAsync(), o);
}

export function keygen(cmd?: string, options?: ICommandOptions): ProcessResult
export function keygen(cmd?: string[], options?: ICommandOptions): ProcessResult
export function keygen(cmd?: unknown, options?: ICommandOptions): ProcessResult {
    const args = ProcessArgs.convert(cmd);
    
    const o = {
        ...options,
        args,
    }
    
    return call2(keygenExe(), o);
}

export function keygenAsync(cmd?: string, options?: ICommandOptions): Promise<ProcessResult>
export function keygenAsync(cmd?: string[], options?: ICommandOptions): Promise<ProcessResult>
export async function keygenAsync(cmd?: unknown, options?: ICommandOptions) {
    const args = ProcessArgs.convert(cmd);
    const o = {
        ...options,
        args,
    }
    
    return await callAsync2(await keygenExeAsync(), o);
}
