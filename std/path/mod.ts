import { extname, basename } from 'https://deno.land/std@0.170.0/path/mod.ts'
export * from 'https://deno.land/std@0.170.0/path/mod.ts'

export function basenameWithoutExtension(path: string) {
    const base = basename(path);
    const ext = extname(base);
    if(ext.length > 0) {
        return base.substring(0, base.length - ext.length);
    }
    return base;
}