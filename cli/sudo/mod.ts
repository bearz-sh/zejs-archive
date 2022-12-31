import { IS_WINDOWS } from "../../std/os/_base.ts";
import { fromFileUrl } from "../../std/path/mod.ts";
import { preCallHooks } from '../../std/process/mod.ts';

export function sudo<T>(action: () => T) { 
    try {
        if(!IS_WINDOWS)
        {
            preCallHooks.push((si) => {
                if(!si.args)
                    si.args = [];
                
                const f = si.file instanceof URL ? fromFileUrl(si.file) : si.file;
                si.args.unshift(f);
                si.file = 'sudo';
            });
        }

        return action();
    } finally {
        preCallHooks.pop();
    }
}


export async function sudoAsync<T>(action: () => Promise<T>) {
    try {
        if(!IS_WINDOWS)
        {
            preCallHooks.push((si) => {
                if(!si.args)
                    si.args = [];
                
                const f = si.file instanceof URL ? fromFileUrl(si.file) : si.file;
                si.args.unshift(f);
                si.file = 'sudo';
            });
        }

        return await action();
    } finally {
        preCallHooks.pop();
    }
}