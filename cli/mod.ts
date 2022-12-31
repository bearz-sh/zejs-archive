import { exists, removeFile, removeFileAsync } from "../std/fs/mod.ts";
import { IS_WINDOWS } from "../std/os/_base.ts";
import  { call as call2, callAsync as callAsync2, ICommandOptions, IArgsConversionOptions, ProcessResult, ProcessArgs } from "../std/process/mod.ts";

export function call(file: string | URL, cmd?: Record<string, unknown>, options?: ICommandOptions, convert?: IArgsConversionOptions): ProcessResult 
export function call(file: string | URL, cmd?: string[], options?: ICommandOptions): ProcessResult 
export function call(file: string | URL, cmd?: string, options?: ICommandOptions): ProcessResult 
export function call(file: string | URL, cmd?: unknown, options?: ICommandOptions, convert?: IArgsConversionOptions): ProcessResult  {
    const args = ProcessArgs.convert(cmd, convert);

    const o  =  {
        ...options,
        args,
    }
    
    return call2(file, o);
}


export async function callAsync(file: string | URL, cmd?: Record<string, unknown>, options?: ICommandOptions, convert?: IArgsConversionOptions): Promise<ProcessResult> 
export async function callAsync(file: string | URL, cmd?: string[], options?: ICommandOptions): Promise<ProcessResult>  
export async function callAsync(file: string | URL, cmd?: string, options?: ICommandOptions): Promise<ProcessResult> 
export async function callAsync(file: string | URL, cmd?: unknown, options?: ICommandOptions, convert?: IArgsConversionOptions): Promise<ProcessResult>   {
    const args = ProcessArgs.convert(cmd, convert);

    const o  =  {
        ...options,
        args,
    }
    
    return await callAsync2(file, o);
}

export function run(file: string | URL, cmd?: Record<string, unknown>, options?: ICommandOptions, convert?: IArgsConversionOptions): ProcessResult 
export function run(file: string | URL, cmd?: string[], options?: ICommandOptions): ProcessResult 
export function run(file: string | URL, cmd?: string, options?: ICommandOptions): ProcessResult 
export function run(file: string | URL, cmd?: unknown, options?: ICommandOptions, convert?: IArgsConversionOptions): ProcessResult  {
    const args = ProcessArgs.convert(cmd, convert);

    const o : Deno.CommandOptions =  {
        ...options,
        args,
        stdout: 'inherit',
        stderr: 'inherit',
    }
    
    return call2(file, o);
}


export async function runAsync(file: string | URL, cmd?: Record<string, unknown>, options?: ICommandOptions, convert?: IArgsConversionOptions): Promise<ProcessResult> 
export async function runAsync(file: string | URL, cmd?: string[], options?: ICommandOptions): Promise<ProcessResult>  
export async function runAsync(file: string | URL, cmd?: string, options?: ICommandOptions): Promise<ProcessResult> 
export async function runAsync(file: string | URL, cmd?: unknown, options?: ICommandOptions, convert?: IArgsConversionOptions): Promise<ProcessResult>   {
    const args = ProcessArgs.convert(cmd, convert);

    const o : Deno.CommandOptions =  {
        ...options,
        args,
        stdout: 'inherit',
        stderr: 'inherit',
    }
    
    return await callAsync2(file, o);
}


export function output(file: string | URL, cmd?: Record<string, unknown>, options?: ICommandOptions, convert?: IArgsConversionOptions): ProcessResult 
export function output(file: string | URL, cmd?: string[], options?: ICommandOptions): ProcessResult 
export function output(file: string | URL, cmd?: string, options?: ICommandOptions): ProcessResult 
export function output(file: string | URL, cmd?: unknown, options?: ICommandOptions, convert?: IArgsConversionOptions): ProcessResult  {
    const args = ProcessArgs.convert(cmd, convert);

    const o : Deno.CommandOptions =  {
        ...options,
        args,
        stdout: 'piped',
        stderr: 'piped',
    }
    
    return call2(file, o);
}


export async function outputAsync(file: string | URL, cmd?: Record<string, unknown>, options?: ICommandOptions, convert?: IArgsConversionOptions): Promise<ProcessResult> 
export async function outputAsync(file: string | URL, cmd?: string[], options?: ICommandOptions): Promise<ProcessResult>  
export async function outputAsync(file: string | URL, cmd?: string, options?: ICommandOptions): Promise<ProcessResult> 
export async function outputAsync(file: string | URL, cmd?: unknown, options?: ICommandOptions, convert?: IArgsConversionOptions): Promise<ProcessResult>   {
    const args = ProcessArgs.convert(cmd, convert);

    const o : Deno.CommandOptions =  {
        ...options,
        args,
        stdout: 'piped',
        stderr: 'piped',
    }
    
    return await callAsync2(file, o);
}

export interface IShellOptions {
    shell: string;
    ext: string;
    args?: (fileName: string) => string[];
    format?: (script: string) => string;
}

export const SHELLS: Record<string, IShellOptions> = {
    cmd: {
        shell: 'cmd',
        ext: '.cmd',
        args: (fileName: string) => ['/c', fileName],
        format (script: string) {
            return `@echo off\n${script}`
        }
    },
    powershell: {
        shell: 'powershell',
        ext: '.ps1',
        args: (fileName: string) => ['-NoLogo', '-ExecutionPolicy', 'ByPass', '-NonIteractive', '-Command . ', fileName],
        format (script: string) {
            return `
$ErrorActionPreference = 'Stop';

${script}

if ((Test-Path -LiteralPath variable:\\LASTEXITCODE)) 
{ 
    exit $LASTEXITCODE 
}
`
        }
    },
    pwsh: {
        shell: 'pwsh',
        ext: '.ps1',
        args: (fileName: string) => ['-NoLogo', '-ExecutionPolicy', 'ByPass', '-NonIteractive', '-Command . ', fileName],
        format (script: string) {
            return `
$ErrorActionPreference = 'Stop';

${script}

if ((Test-Path -LiteralPath variable:\\LASTEXITCODE)) 
{ 
    exit $LASTEXITCODE 
}
`
        }
    },
    bash: {
        shell: 'bash',
        ext: '.sh',
        args: (fileName: string) => ['-noprofile', '--norc', '-e', '-o', 'pipefail', fileName],
    },
    zsh: {
        shell: 'zsh',
        ext: '.sh',
        args: (fileName: string) => ['-noprofile', '--norc', '-e', '-o', 'pipefail', fileName],
    },
    sh: {
        shell: 'sh',
        ext: '.sh',
        args: (fileName: string) => ['-e', fileName],
    },
    python: {
        shell: 'python',
        ext: '.py',

    },
    ruby: {
        shell: 'ruby',
        ext: '.rb',
    },
    'deno-ts': {
        shell: 'deno',
        ext: '.ts',
        args: (fileName: string) => ['run', '--allow-all', fileName],
    },
    'deno': {
        shell: 'deno',
        ext: '.js',
        args: (fileName: string) => ['run', '--allow-all', fileName],
    },
}


export function exec(script: string, options?: ICommandOptions & { shell?: string }) {
    const o = options || {};
    if(!o.shell) {
        o.shell = IS_WINDOWS ? "powershell" : "bash";
    }

    const shell = SHELLS[o.shell];
    if(!shell) {
        throw new Error(`Shell ${o.shell} not supported`);
    }

    const fileName = Deno.makeTempFileSync({ prefix: 'exec_', suffix: shell.ext });
   

    try {
        script = shell.format ? shell.format(script) : script;
        Deno.writeTextFileSync(fileName, script);
        const args = shell.args ? shell.args(fileName) : [fileName];

        return call(shell.shell, args, o);
    } finally {
        if(exists(fileName)) {
            removeFile(fileName);
        }
    }
}

export async function execAsync(script: string, options?: ICommandOptions & { shell?: string }) {
    const o = options || {};
    if(!o.shell) {
        o.shell = IS_WINDOWS ? "powershell" : "bash";
    }

    const shell = SHELLS[o.shell];
    if(!shell) {
        throw new Error(`Shell ${o.shell} not supported`);
    }

    const fileName = await Deno.makeTempFile({ prefix: 'deno_exec_', suffix: shell.ext });

    try {
        script = shell.format ? shell.format(script) : script;
        Deno.writeTextFile(fileName, script);
        const args = shell.args ? shell.args(fileName) : [fileName];

        return await callAsync(shell.shell, args, o);
    } finally {
        if(exists(fileName)) {
            await removeFileAsync(fileName);
        }
    }
}