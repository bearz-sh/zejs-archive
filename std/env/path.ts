import { IS_WINDOWS, PATH_SEPARATOR } from "../os/_base.ts";


const key = IS_WINDOWS ? "Path" : "PATH";

export function get() {
    return Deno.env.get(key) || '';
}

export function set(path: string) {
    Deno.env.set(key, path);
}

export function split() {
    return get().split(PATH_SEPARATOR).filter(o => o.trim().length !== 0);
}

function hasInternal(path: string, paths: string[]) {
    if(IS_WINDOWS) {
        return paths.some(o => o.toLowerCase() === path.toLowerCase());
    }

    return paths.some(o => o === path);
}

export function has(path: string) {
     return hasInternal(path, split());
}

export function add(path: string, prepend = false) {
    if(has(path))
        return;

    const current = get();
    if(prepend) {
        set(`${path}${PATH_SEPARATOR}${current}`);
    }
    else {
        set(`${current}${PATH_SEPARATOR}${path}`);
    }
}

export function remove(path: string) {
    const paths = split();
    if(!hasInternal(path, paths))
        return;

    if (IS_WINDOWS) {
        const r: string[] = [];
        paths.forEach(o => {
            if(o.toLowerCase() !== path.toLowerCase()) {
                r.push(o);
            }
        });

        set(r.join(PATH_SEPARATOR));
    }

    set(paths.filter(o => o !== path).join(PATH_SEPARATOR));
}
