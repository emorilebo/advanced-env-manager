import { Schema } from 'joi';
import { EnvConfig } from './types';
export declare function initEnvManager(schema: Schema, useCloudSecrets?: boolean): Promise<EnvConfig>;
export { EnvConfig, Schema };
export { default as EnvManager } from './EnvManager';
