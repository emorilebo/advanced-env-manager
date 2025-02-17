import fs from 'fs';
import dotenv from 'dotenv';
import { validateEnv } from './validator';
import { fetchCloudSecrets } from './cloudIntegration';
import { EnvManagerOptions, EnvConfig } from './types';

class EnvManager {
  private encryptionKey: string;
  private envPath: string;
  private schema?: EnvManagerOptions['schema'];
  private useCloud: boolean;

  constructor(options: EnvManagerOptions = {}) {
    this.encryptionKey = options.encryptionKey || process.env.ENV_ENCRYPTION_KEY || '';
    this.envPath = options.envPath || '.env';
    this.schema = options.schema;
    this.useCloud = options.useCloud || false;
  }

  async initialize(): Promise<EnvConfig> {
    // Load local environment variables
    if (fs.existsSync(this.envPath)) {
      dotenv.config({ path: this.envPath });
    }

    let envConfig: EnvConfig = { ...process.env };

    // Fetch and merge cloud secrets if enabled
    if (this.useCloud) {
      try {
        const cloudSecrets = await fetchCloudSecrets();
        envConfig = { ...envConfig, ...cloudSecrets };
      } catch (error) {
        console.warn('Failed to fetch cloud secrets:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Validate if schema is provided
    if (this.schema) {
      envConfig = validateEnv(envConfig, this.schema);
    }

    return envConfig;
  }
}

export default EnvManager; 