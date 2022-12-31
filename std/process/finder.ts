import { expand } from "../env/_base.ts";
import { exists, existsAsync } from "../fs/mod.ts";
import { which, whichAsync } from "./which.ts";


export interface IExcutableLookupOptions {
    exe: string;
    path?: string;
    windows?: string[],
    linux?: string[],
    darwin?: string[],
}

export interface IExecutableLookup extends IExcutableLookupOptions {
    name: string;
}

const registry = new Map<string, IExcutableLookupOptions>();

export function register(options: IExcutableLookupOptions) {
    registry.set(options.exe.toLowerCase(), options);
}

export function find(name: string) {
    
    const key = name.toLowerCase();
    const options = registry.get(key);
    if(!options)
    {
        const o : IExcutableLookupOptions = { exe: name }
        const r =  which(name);
        o.path = r;
        register(o)
        return r;
    }

    if(options.path)
        return options.path;

    const exe = which(options.exe);
    if(exe)
    {
        options.path = exe;
        return exe;
    }

    const platform = Deno.build.os;
    let platformSpecific = options[platform];
    if(platformSpecific)
    {
        for(const p of platformSpecific)
        {
            const location = expand(p)
            if(exists(location))
            {
                options.path = location;
                return location;
            }
        }
    }

    if(Deno.build.os === 'darwin')
    {
        platformSpecific = options.linux;
        if(platformSpecific)
        {
            for(const p of platformSpecific)
            {
                const location = expand(p)
                if(exists(location))
                {
                    options.path = location;
                    return location;
                }
            }
        }   
    }

    return null;
}

export async function findAsync(name: string) {
    
    const key = name.toLowerCase();
    const options = registry.get(key);
    if(!options)
    {
        const o : IExcutableLookupOptions = { exe: name }
        const r =  await whichAsync(name);
        o.path = r;
        register(o)
        return r;
    }

    if(options.path)
        return options.path;

    const exe = await whichAsync(options.exe);
    if(exe)
    {
        options.path = exe;
        return exe;
    }

    const platform = Deno.build.os;
    let platformSpecific = options[platform];
    if(platformSpecific)
    {
        for(const p of platformSpecific)
        {
            const location = expand(p)
            if(await existsAsync(location))
            {
                options.path = location;
                return location;
            }
        }
    }

    if(Deno.build.os === 'darwin')
    {
        platformSpecific = options.linux;
        if(platformSpecific)
        {
            for(const p of platformSpecific)
            {
                const location = expand(p)
                if(await existsAsync(location))
                {
                    options.path = location;
                    return location;
                }
            }
        }   
    }

    return null;
}

export function findOrThrow(name: string) {
    const r = find(name);
    if(!r)
        throw new Error(`Executable not found: ${name}`);
    return r;
}

export async function findOrThrowAsync(name: string) {
    const r = await findAsync(name);
    if(!r)
        throw new Error(`Executable not found: ${name}`);
    return r;
}