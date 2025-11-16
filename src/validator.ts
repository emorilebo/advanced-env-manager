import { Schema } from 'joi';
import { EnvConfig } from './types';

/**
 * Validates environment variables against a Joi schema
 * @param envConfig - Environment configuration object to validate
 * @param schema - Joi schema to validate against
 * @returns Validated and transformed environment configuration
 * @throws Error if validation fails
 */
export function validateEnv(envConfig: EnvConfig, schema: Schema): EnvConfig {
  const { error, value } = schema.validate(envConfig, {
    allowUnknown: true,
    stripUnknown: false,
    abortEarly: false, // Collect all errors, not just the first one
  });

  if (error) {
    const errorDetails = error.details
      .map((detail) => `${detail.path.join('.')}: ${detail.message}`)
      .join('; ');
    throw new Error(`Environment validation error: ${errorDetails}`);
  }

  return value as EnvConfig;
}
