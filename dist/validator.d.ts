import { Schema } from 'joi';
import { EnvConfig } from './types';
/**
 * Validates environment variables against a Joi schema
 * @param envConfig - Environment configuration object to validate
 * @param schema - Joi schema to validate against
 * @returns Validated and transformed environment configuration
 * @throws Error if validation fails
 */
export declare function validateEnv(envConfig: EnvConfig, schema: Schema): EnvConfig;
