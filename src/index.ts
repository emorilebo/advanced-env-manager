import { Schema } from 'joi';
import { loadEnv } from './loader';
import { validateEnv } from './validator';
import { fetchCloudSecrets } from './cloudIntegration';
import { EnvConfig } from './types';

export async function initEnvManager(schema: Schema, useCloudSecrets = false): Promise<EnvConfig> {
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

export { EnvConfig, Schema };
export { default as EnvManager } from './EnvManager'; 