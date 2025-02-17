import { EnvManagerOptions, EnvConfig } from './types';
declare class EnvManager {
    private encryptionKey;
    private envPath;
    private schema?;
    private useCloud;
    constructor(options?: EnvManagerOptions);
    initialize(): Promise<EnvConfig>;
}
export default EnvManager;
