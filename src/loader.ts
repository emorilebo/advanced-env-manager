import dotenv from 'dotenv';
import fs from 'fs';
import { EnvConfig } from './types';

export function loadEnv(envFilePath = '.env'): EnvConfig {
  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath });
  }

  return process.env;
} 