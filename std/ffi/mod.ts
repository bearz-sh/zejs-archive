const encoder = new TextEncoder();

export function toCString(str: string): Uint8Array {
    const bytes = encoder.encode(str + "\0");
    return bytes;
}

// deno-lint-ignore no-explicit-any
const { op_ffi_cstr_read, op_ffi_get_buf } = (Deno as any).core.ops;

export { op_ffi_cstr_read as readCstring, op_ffi_get_buf as buf };