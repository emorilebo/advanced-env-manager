import { Schema } from 'joi';
import { EnvConfig } from './types';

export function validateEnv(envConfig: EnvConfig, schema: Schema): EnvConfig {
  const { error, value } = schema.validate(envConfig, { allowUnknown: true });

  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }

  return value;
} 