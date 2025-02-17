import { Schema } from 'joi';

export interface EnvManagerOptions {
  encryptionKey?: string;
  envPath?: string;
  schema?: Schema;
  useCloud?: boolean;
}

export interface CloudSecrets {
  [key: string]: string;
}

export interface EnvConfig {
  [key: string]: string | undefined;
} 