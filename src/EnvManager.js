const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { validateEnv } = require('./validator');
const { fetchCloudSecrets } = require('./cloudIntegration');

class EnvManager {
  constructor(options = {}) {
    this.encryptionKey = options.encryptionKey || process.env.ENV_ENCRYPTION_KEY;
    this.envPath = options.envPath || '.env';
    this.schema = options.schema;
    this.useCloud = options.useCloud || false;
  }

  async initialize() {
    // Load local environment variables
    if (fs.existsSync(this.envPath)) {
      dotenv.config({ path: this.envPath });
    }

    let envConfig = { ...process.env };

    // Fetch and merge cloud secrets if enabled
    if (this.useCloud) {
      try {
        const cloudSecrets = await fetchCloudSecrets();
        envConfig = { ...envConfig, ...cloudSecrets };
      } catch (error) {
        console.warn('Failed to fetch cloud secrets:', error.message);
      }
    }

    // Validate if schema is provided
    if (this.schema) {
      envConfig = validateEnv(envConfig, this.schema);
    }

    return envConfig;
  }
}

module.exports = EnvManager; 