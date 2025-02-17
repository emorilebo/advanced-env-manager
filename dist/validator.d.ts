import { Schema } from 'joi';
import { EnvConfig } from './types';
export declare function validateEnv(envConfig: EnvConfig, schema: Schema): EnvConfig;
