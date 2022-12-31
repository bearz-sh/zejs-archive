import { join, dirname } from '../path/mod.ts';
import { specialDir } from '../env/mod.ts';
import { 
    readJsonFileAsync, 
    writeJsonFile, 
    exists,
    existsAsync, 
    makeDirectory, 
    makeDirectoryAsync, 
     
    writeJsonFileAsync } from '../fs/mod.ts';


export interface ISecretVault {
    
    keys: string[]; 

    loadAsync() : Promise<void>
    
    has(key: string) : boolean;

    hasAsync(key: string) : Promise<boolean>;

    get(key: string) : string | null;
    
    getAsync(key: string) : Promise<string | null>;
    
    set(key: string, value: string) : void;
    
    setAsync(key: string, value: string) : Promise<void>;

    delete(key: string) : void 

    deleteAsync(key: string) : Promise<void>
}

function normalizeKey(key: string) {
    return key.replace(/[_-\.:/]/gi, "-").toLowerCase();
}

export class MemorySecretVault implements ISecretVault {
    #secrets: {[key: string] : string | undefined }

    constructor() {
        this.#secrets = {};
    }
    
    get keys() {
        return Object.keys(this.#secrets);
    }

    protected setData(secrets: { [key: string]: string | undefined }) {
        this.#secrets = secrets;
    }

    protected getData() {
        return this.#secrets;
    }

    loadAsync(): Promise<void> {
        return Promise.resolve();
    }

    has(key: string): boolean {
        return this.#secrets[normalizeKey(key)] != undefined
    }

    hasAsync(key: string): Promise<boolean> {
        return Promise.resolve(this.has(key));
    }

    get(key: string): string | null {
        const v = this.#secrets[normalizeKey(key)];
        if(v === undefined)
            return null;

        return v;
    }

    getAsync(key: string): Promise<string | null> {
        return Promise.resolve(this.get(key));
    }

    set(key: string, value: string): void {
        this.#secrets[normalizeKey(key)] = value;
    }

    setAsync(key: string, value: string): Promise<void> {
        return Promise.resolve(this.set(key, value));
    }

    delete(key: string): void {
        delete this.#secrets[normalizeKey(key)];
    }

    deleteAsync(key: string): Promise<void> {
        return Promise.resolve(this.delete(key));
    }
}

export class TextSecretVault extends MemorySecretVault {
    #file: string;

    constructor(file: string) {
        super();

        this.#file = file || join(specialDir('homeConfig'), 'solovis', 'secrets.plain.json');
    }

    get file() {
        return this.#file;
    }

    override async loadAsync(): Promise<void> {
        if(await existsAsync(this.#file)) {
            const data = await readJsonFileAsync(this.#file);
            this.setData(data);
        }
    }

    override delete(key: string) : void {
        super.delete(key);
        this.save();
    }

    override async deleteAsync(key: string): Promise<void> {
        await super.deleteAsync(key);
        await this.saveAsync();
    }

    override set(key: string, value: string): void {
        super.set(key, value);
        this.save();
    }

    override async setAsync(key: string, value: string): Promise<void> {
        await super.setAsync(key, value);
        await this.saveAsync();
    }

    save() {
        const dir = dirname(this.#file);
        if (!exists(dir)) {
            makeDirectory(dir, { recursive: true });
        }

        writeJsonFile(this.#file, this.getData())
    }

    async saveAsync() {
        const dir = dirname(this.#file);
        if (! await existsAsync(dir)) {
            await makeDirectoryAsync(dir, { recursive: true });
        }

        await writeJsonFileAsync(this.#file, this.getData())
    }
}