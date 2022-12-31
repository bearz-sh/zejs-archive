export function get(key: string): string | undefined {
    return Deno.env.get(key);
}

export function set(key: string, value: string): void {
    Deno.env.set(key, value);
}

export function unset(key: string): void {
    Deno.env.delete(key);
}

export function has(key: string): boolean {
    return Deno.env.get(key) !== undefined;
}

export function keys(): string[] {
    return Object.keys(Deno.env.toObject());
}

export function values(): string[] {
    return Object.values(Deno.env.toObject());
}

export function entries(): [string, string][] {
    return Object.entries(Deno.env.toObject());
}

export function toObject(): { [key: string]: string } {
    return Deno.env.toObject();
}

export function expand(value: string, windows = true, getValue?: (name: string) => string | undefined): string {
    getValue = getValue || get;
    if (windows) {
        // windows environment variable style expansion %variable%
        value = value.replace(/%([^%]+)%/gi, function (_, variableName: string) {
            const v = getValue!(variableName);
            
            return v || '';
        });
    }

    // linux environment variable style expansion ${variable}
    value = value.replace(
        /\$\{([^\}]+)\}/g,
        function (_: unknown, variableName: string) {

            if(!variableName) {
                return '';
            }

            if(variableName.includes(":-")) {
                const [name, defaultValue] = variableName.split(":-");
                return getValue!(name) || defaultValue;
            }

            if(variableName.includes("-")) {
                const [name, defaultValue] = variableName.split(":");
                return getValue!(name) || defaultValue;
            }

            if(variableName.includes("?")) {
                const [name, error] = variableName.split("?");
                const v = getValue!(name);
                if(!v) {
                    throw new Error(error);
                }
                return v;
            }

            return getValue!(variableName) || '';
        },
    );

    // linux environment variable style expansion $variable
    value = value.replace(
        /\$([A-Za-z0-9]+)/g,
        function (_, variableName: string) {
            return getValue!(variableName) || '';
        },
    );
    return value;
}