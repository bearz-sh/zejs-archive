
export * from './_base.ts';
import { join } from '../path/mod.ts'
import { IS_WINDOWS } from '../os/_base.ts';
import { exec } from '../process/_base.ts';
export * as path from "../os/_path.ts";

let userValue : string | null = null;
let homeDirValue : string | null = null;
let tmpValue : string | null = null;
let isAdminValue : boolean | null = null;
let isUserElevatedValue : boolean | null = null;

export function isRoot() {
    return Deno.uid() === 0;
}

export function isAdmin() {
    if(isAdminValue !== null) {
        return isAdminValue;
    }

    if(IS_WINDOWS) {
        const result = exec('net session');
        isAdminValue = result.success();
    } else {
        isAdminValue = false;
    }

    return isAdminValue
}

export function isUserElevated() {
    if(isUserElevatedValue !== null) {
        return isUserElevatedValue;
    }

    if(IS_WINDOWS) {
        isUserElevatedValue = isAdmin();
    } else {
        isUserElevatedValue = isRoot();
    }

    return isUserElevatedValue;
}

export function user() {
    if(userValue) {
        return userValue;
    }
    
    const x = Deno.env.get('USER') || Deno.env.get('USERNAME');
    if(x) {
        userValue = x;
        return x;
    }

    if(IS_WINDOWS) {
        const result = exec('whoami');
        userValue = result.throwOrContinue().stdoutAsString.trim();
    } else {
        const result = exec('id -un');
        userValue = result.throwOrContinue().stdoutAsString.trim();
    }

    if(!userValue || userValue.length === 0) {
        throw new Error('Unable to determine user');
    }

    return userValue;
}

export function unsudoUser() {
    if(IS_WINDOWS) {
        return user();
    }

    if(Deno.env.get('SUDO_USER')) {
        return Deno.env.get('SUDO_USER');
    }

    if (!isRoot()) {
        return user();
    }


    const result = exec('logname');
    if(result.success()) {
        return result.stdoutAsString.trim();
    }

    throw new Error('Unable to determine non sudo user');
}

export function homeDir() {
    if(homeDirValue) {
        return homeDirValue;
    }

    const x = Deno.env.get('HOME') || Deno.env.get('USERPROFILE');
    if(x) {
        homeDirValue = x;
        return x;
    }

    const u = user();
    if(IS_WINDOWS) {
        const drive = specialDir('systemDrive');
        return `${drive}/Users/${u}`;
    } else {
        return `/home/${u}`
    }
}

export function tmpDir() {
    if(tmpValue) {
        return tmpValue;
    }
    const x = Deno.env.get('TMPDIR') || Deno.env.get('TMP') || Deno.env.get('TEMP');
    if(x) {
        tmpValue = x;
        return x;
    }

    if(IS_WINDOWS) {
        const h = homeDir();
        return join(h, 'AppData', 'Local', 'Temp');
    } else {
        return '/tmp';
    }
}

export type SpecialDir = 'home' | 
    'homeConfig' | 
    'homeData' | 
    'homeCache' | 
    'desktop' | 
    'downloads' | 
    'tmp' | 
    'opt' | 
    'etc' | 
    'fonts' | 
    'appData' | 
    'localAppData' |
    'systemDrive';

export function specialDir(dir: SpecialDir): string {
    switch (dir) {
        case 'systemDrive':
            if(!IS_WINDOWS) {
                return ''
            }

            return Deno.env.get('SystemDrive') || 'C:';
        case 'home':
            return homeDir();
        case 'homeConfig':
        case 'appData':
            {
                const hc = Deno.env.get('XDG_CONFIG_HOME') || Deno.env.get('APPDATA');
                if(hc) {
                    return hc;
                }

                if(IS_WINDOWS) {
                    const h = homeDir();
                    return join(h, 'AppData', 'Roaming');
                } 
                
                return join(homeDir(), '.config');
            }
        case 'homeData':
        case 'localAppData':
            {
                const hc = Deno.env.get('XDG_DATA_HOME') || Deno.env.get('LOCALAPPDATA');
                if(hc) {
                    return hc;
                }

                if(IS_WINDOWS) {
                    const h = homeDir();
                    return join(h, 'AppData', 'Local');
                }

                return join(homeDir(), '.local', 'share');
            }
        case 'homeCache':
            {
                const hc = Deno.env.get('XDG_DATA_HOME') || Deno.env.get('LOCALAPPDATA');
                if(hc) {
                    return hc;
                }

                if(IS_WINDOWS) {
                    const h = homeDir();
                    return join(h, 'AppData', 'Local');
                }

                return join(homeDir(), '.cache');
            }
        case 'desktop':
            return join(homeDir(), 'Desktop');
        case 'downloads':
            return join(homeDir(), 'Downloads');
        case 'tmp':
            return tmpDir();
        case 'opt':
            {
                if(IS_WINDOWS) {
                    const x = Deno.env.get('ProgramFiles');
                    if(x) {
                        return x;
                    }
                    return 'C:/Program Files';
                } 

                return '/opt';
            }
        case 'etc':
            return '/etc';
        case 'fonts':
            return '/usr/share/fonts';
    }
}