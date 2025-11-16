import { Schema } from 'joi';
import { loadEnv } from './loader';
import { validateEnv } from './validator';
import { fetchCloudSecrets } from './cloudIntegration';
import { EnvConfig } from './types';

/**
 * Initializes environment manager with a schema and optional cloud secrets
 * @param schema - Joi schema for validation
 * @param useCloudSecrets - Whether to fetch secrets from AWS Secrets Manager
 * @returns Promise resolving to validated environment configuration
 * @deprecated Use EnvManager class directly for better control and features
 */
export async function initEnvManager(
  schema: Schema,
  useCloudSecrets = false
): Promise<EnvConfig> {
  const envConfig = loadEnv();

  if (useCloudSecrets) {
    const cloudSecrets = await fetchCloudSecrets();
    Object.assign(envConfig, cloudSecrets);
  }

  if (schema) {
    return validateEnv(envConfig, schema);
  }

  return envConfig;
}

// Export main class and types
export { default as EnvManager } from './EnvManager';
export type { EnvConfig, EnvManagerOptions, CloudSecrets } from './types';
export type { Schema } from 'joi';

// Export utility functions
export { loadEnv } from './loader';
export { validateEnv } from './validator';
export { fetchCloudSecrets, initAWS } from './cloudIntegration';
