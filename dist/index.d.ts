import { Schema } from 'joi';
import { EnvConfig } from './types';
/**
 * Initializes environment manager with a schema and optional cloud secrets
 * @param schema - Joi schema for validation
 * @param useCloudSecrets - Whether to fetch secrets from AWS Secrets Manager
 * @returns Promise resolving to validated environment configuration
 * @deprecated Use EnvManager class directly for better control and features
 */
export declare function initEnvManager(schema: Schema, useCloudSecrets?: boolean): Promise<EnvConfig>;
export { default as EnvManager } from './EnvManager';
export type { EnvConfig, EnvManagerOptions, CloudSecrets } from './types';
export type { Schema } from 'joi';
export { loadEnv } from './loader';
export { validateEnv } from './validator';
export { fetchCloudSecrets, initAWS } from './cloudIntegration';
