import { Schema } from 'joi';
/**
 * Configuration options for EnvManager
 */
export interface EnvManagerOptions {
    /** Encryption key for encrypting/decrypting sensitive values */
    encryptionKey?: string;
    /** Path to the .env file (defaults to '.env') */
    envPath?: string;
    /** Joi schema for validating environment variables */
    schema?: Schema;
    /** Whether to fetch secrets from AWS Secrets Manager */
    useCloud?: boolean;
}
/**
 * Cloud secrets structure (key-value pairs)
 */
export interface CloudSecrets {
    [key: string]: string;
}
/**
 * Environment configuration structure
 */
export interface EnvConfig {
    [key: string]: string | undefined;
}
