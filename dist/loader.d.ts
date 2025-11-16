import { EnvConfig } from './types';
/**
 * Loads environment variables from a .env file
 * @param envFilePath - Path to the .env file (defaults to '.env')
 * @returns Environment configuration object
 */
export declare function loadEnv(envFilePath?: string): EnvConfig;
