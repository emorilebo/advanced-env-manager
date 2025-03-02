/// <reference types="node" />
import { EnvManagerOptions } from './types';
export declare class EnvManager {
    private envPath;
    private schema?;
    private useCloud;
    constructor(options?: EnvManagerOptions);
    initialize(): Promise<NodeJS.ProcessEnv>;
}
