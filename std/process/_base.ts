export class ProcessResult
{
    #output: Deno.CommandOutput;
    #si: IStartInfo
    #stdoutString?: string;
    #stderrString?: string;
    #stdoutLines?: string[];
    #stderrLines?: string[];

    constructor(si: IStartInfo, output: Deno.CommandOutput) 
    {
        this.#si = si;
        this.#output = output;
    }

    get file() {
        return this.#si?.file;
    }

    get args() {
        return this.#si.args;
    }

    get code() {
        return this.#output.code;
    }

    get signal() {
        return this.#output.signal;
    }

    get stdout() {
        if(this.#si?.stdout === 'piped') {
            return this.#output.stdout;
        }

        return new Uint8Array();
    }

    get stdoutAsString() {
        if(this.#stdoutString) {
            return this.#stdoutString;
        }

        if(this.#si?.stdout === 'piped') { 
            this.#stdoutString = new TextDecoder().decode(this.#output.stdout);
        } else {
            this.#stdoutString = '';
        }

        return this.#stdoutString;
    }

    get stderr() {
        if(this.#si?.stderr === 'piped') {
            return this.#output.stderr;
        }

        return new Uint8Array();
    }

    get stderrAsString() {
        if(this.#stderrString) {
            return this.#stderrString;
        }

        if(this.#si?.stderr === 'piped') {
            this.#stderrString = new TextDecoder().decode(this.#output.stderr);
        } else {
            this.#stderrString = '';
        }

        return this.#stderrString;
    }

    get stdoutAsLines() {   
        if(this.#stdoutLines) {
            return this.#stdoutLines;
        }

        if(this.#si?.stdout === 'piped') {
            this.#stdoutLines = this.stdoutAsString.split('\n');
        } else {
            this.#stdoutLines = [];
        }

        return this.#stdoutLines;
    }

    get stderrAsLines() {
        if(this.#stderrLines) {
            return this.#stderrLines;
        }

        if(this.#si?.stderr === 'piped') {
            this.#stderrLines = this.stderrAsString.split('\n');
        }

        return this.#stderrLines;
    }

    success(validate?: (code: number) => boolean) {
        if(!validate) {
            return this.code === 0;
        }

        return validate(this.code);
    }

    throwOrContinue(validate?: (code: number) => boolean) {
        if(!this.success(validate)) {
            throw new Error(`Process failed with code ${this.code} and signal ${this.signal}`);
        }

        return this;
    }
}

export function pid() {
    return Deno.pid;
}

export function args() {
    return Deno.args;
}

export function cwd() {
    return Deno.cwd();
}

export function kill(pid: number, signal?: Deno.Signal) {
    Deno.kill(pid, signal);
}

export function exit(code: number) {
    Deno.exit(code);
}

export function spawn(file: string | URL, options?: Deno.CommandOptions) {
    const cmd = new Deno.Command(file, options);
    return cmd.spawn();
}

export interface ICommandOptions {
     /**
     * The working directory of the process.
     *
     * If not specified, the `cwd` of the parent process is used.
     */
     cwd?: string | URL;
     /**
      * Clear environmental variables from parent process.
      *
      * Doesn't guarantee that only `env` variables are present, as the OS may
      * set environmental variables for processes.
      */
     clearEnv?: boolean;
     /** Environmental variables to pass to the subprocess. */
     env?: Record<string, string>;
     /**
      * Sets the child process’s user ID. This translates to a setuid call in the
      * child process. Failure in the set uid call will cause the spawn to fail.
      */
     uid?: number;
     /** Similar to `uid`, but sets the group ID of the child process. */
     gid?: number;
     /**
      * An {@linkcode AbortSignal} that allows closing the process using the
      * corresponding {@linkcode AbortController} by sending the process a
      * SIGTERM signal.
      *
      * Ignored by {@linkcode Command.outputSync}.
      */
     signal?: AbortSignal;
 
     /** How `stdin` of the spawned process should be handled.
      *
      * Defaults to `"null"`. */
     stdin?: "piped" | "inherit" | "null";
     /** How `stdout` of the spawned process should be handled.
      *
      * Defaults to `"piped"`. */
     stdout?: "piped" | "inherit" | "null";
     /** How `stderr` of the spawned process should be handled.
      *
      * Defaults to "piped". */
     stderr?: "piped" | "inherit" | "null";
 
     /** Skips quoting and escaping of the arguments on Windows. This option
      * is ignored on non-windows platforms. Defaults to `false`. */
     windowsRawArguments?: boolean;
}

export interface IStartInfo extends Deno.CommandOptions {
    file: string | URL;
}

export interface IPreCallHook {
    (si: IStartInfo): void;
}

export interface IPostCallHook {
    (si: IStartInfo, result?: ProcessResult): void;
}

export const preCallHooks: IPreCallHook[] = [];

export const postCallHooks: IPostCallHook[] = [];

export function call(file: string | URL, options?: Deno.CommandOptions) {
    const si: IStartInfo = {
        ...options,
        file,
    }
    preCallHooks.forEach(hook => hook(si));
    const cmd = new Deno.Command(si.file, si);
    const output = cmd.outputSync();

    const result = new ProcessResult(si, output);
    postCallHooks.forEach(hook => hook(si, result));

    return result;
}

export async function callAsync(file: string | URL, options?: Deno.CommandOptions) {
    const si: IStartInfo = {
        ...options,
        file,
    }
    preCallHooks.forEach(hook => hook(si));

    const cmd = new Deno.Command(file, options);
    const output = await cmd.output();
    
    const result = new ProcessResult(si, output);
    postCallHooks.forEach(hook => hook(si, result));

    return result;
}

export function run(file: string | URL, options?: Deno.CommandOptions) {
    const o : Deno.CommandOptions =  {
        ...options,
        stdout: 'inherit',
        stderr: 'inherit'
    }
    
    return call(file, o);
}

export async function runAsync(file: string | URL, options?: Deno.CommandOptions) {
    const o : Deno.CommandOptions =  {
        ...options,
        stdout: 'inherit',
        stderr: 'inherit'
    }
    
    return await callAsync(file, o);
}

export function output(file: string | URL, options?: Deno.CommandOptions) {
    const o : Deno.CommandOptions =  {
        ...options,
        stdout: 'piped',
        stderr: 'piped'
    }
    
    return call(file, o);
}

export async function outputAsync(file: string | URL, options?: Deno.CommandOptions) {
    const o : Deno.CommandOptions =  {
        ...options,
        stdout: 'piped',
        stderr: 'piped'
    }
    
    return await callAsync(file, o);
}