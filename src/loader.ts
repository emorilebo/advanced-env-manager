import dotenv from 'dotenv';
import fs from 'fs';
import { EnvConfig } from './types';

/**
 * Loads environment variables from a .env file
 * @param envFilePath - Path to the .env file (defaults to '.env')
 * @returns Environment configuration object
 */
export function loadEnv(envFilePath = '.env'): EnvConfig {
  if (fs.existsSync(envFilePath)) {
    const result = dotenv.config({ path: envFilePath });
    if (result.error) {
      console.warn(
        `Warning: Failed to load .env file from ${envFilePath}: ${result.error.message}`
      );
    }
  }

  return { ...process.env } as EnvConfig;
}
