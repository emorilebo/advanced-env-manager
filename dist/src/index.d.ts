import { Schema } from 'joi';
import { EnvConfig } from './types';
export declare function initEnvManager(schema: Schema, useCloudSecrets?: boolean): Promise<EnvConfig>;
export { EnvConfig, Schema };
export { EnvManager } from './EnvManager';
export { fetchCloudSecrets } from './cloudIntegration';
export type { EnvManagerOptions } from './types';
