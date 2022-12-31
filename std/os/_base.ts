

export const IS_WINDOWS = Deno.build.os === 'windows'
export const IS_LINUX = Deno.build.os === 'linux'
export const IS_MAC = Deno.build.os === 'darwin'

export const PATH_SEPARATOR = IS_WINDOWS ? ';' : ':'
export const DIR_SEPARATOR = IS_WINDOWS ? '\\' : '/'
export const NEWLINE = IS_WINDOWS ? '\r\n' : '\n';
export const EOL = NEWLINE;
export const VOLUME_SEPARATOR = IS_WINDOWS ? ':' : '';