import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { validateEnv } from './validator';
import { fetchCloudSecrets } from './cloudIntegration';
import { EnvManagerOptions, EnvConfig } from './types';

/**
 * Advanced Environment Manager
 *
 * Provides secure environment variable management with:
 * - Validation using Joi schemas
 * - AWS Secrets Manager integration
 * - Encryption/decryption of sensitive values
 * - Type-safe configuration
 *
 * @example
 * ```typescript
 * const envManager = new EnvManager({
 *   encryptionKey: 'your-encryption-key',
 *   envPath: '.env',
 *   schema: mySchema,
 *   useCloud: true
 * });
 *
 * const config = await envManager.initialize();
 * ```
 */
class EnvManager {
  private encryptionKey: string;
  private envPath: string;
  private schema?: EnvManagerOptions['schema'];
  private useCloud: boolean;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly tagPosition = this.saltLength + this.ivLength;
  private readonly encryptedDataPosition = this.tagPosition + this.tagLength;

  /**
   * Creates a new EnvManager instance
   * @param options - Configuration options for the environment manager
   */
  constructor(options: EnvManagerOptions = {}) {
    this.encryptionKey =
      options.encryptionKey || process.env.ENV_ENCRYPTION_KEY || '';
    this.envPath = options.envPath || '.env';
    this.schema = options.schema;
    this.useCloud = options.useCloud || false;

    if (
      !this.encryptionKey &&
      (options.encryptionKey !== undefined || process.env.ENV_ENCRYPTION_KEY)
    ) {
      console.warn(
        'Warning: Encryption key is empty. Encrypt/decrypt functionality will not work properly.'
      );
    }
  }

  /**
   * Initializes the environment manager by loading and validating environment variables
   * @returns Promise resolving to validated environment configuration
   * @throws Error if validation fails
   */
  async initialize(): Promise<EnvConfig> {
    // Load local environment variables
    if (fs.existsSync(this.envPath)) {
      const result = dotenv.config({ path: this.envPath });
      if (result.error) {
        console.warn(
          `Warning: Failed to load .env file from ${this.envPath}: ${result.error.message}`
        );
      }
    }

    let envConfig: EnvConfig = { ...process.env };

    // Fetch and merge cloud secrets if enabled
    if (this.useCloud) {
      try {
        const cloudSecrets = await fetchCloudSecrets();
        envConfig = { ...envConfig, ...cloudSecrets };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.warn(
          `Failed to fetch cloud secrets: ${errorMessage}. Continuing with local environment variables only.`
        );
      }
    }

    // Validate if schema is provided
    if (this.schema) {
      envConfig = validateEnv(envConfig, this.schema);
    }

    return envConfig;
  }

  /**
   * Encrypts a sensitive value using AES-256-GCM
   * @param value - The value to encrypt
   * @returns Encrypted string in format: salt:iv:tag:encryptedData (all base64 encoded)
   * @throws Error if encryption key is not set
   */
  encrypt(value: string): string {
    if (!this.encryptionKey) {
      throw new Error(
        'Encryption key is required. Set ENV_ENCRYPTION_KEY or provide encryptionKey in options.'
      );
    }

    if (!value) {
      return value;
    }

    try {
      // Generate salt for key derivation
      const salt = crypto.randomBytes(this.saltLength);

      // Derive key from encryption key and salt
      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        100000, // iterations
        32, // key length (256 bits)
        'sha256'
      );

      // Generate IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      // Encrypt the value
      let encrypted = cipher.update(value, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Combine salt, iv, tag, and encrypted data
      const combined = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, 'base64'),
      ]);

      return combined.toString('base64');
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypts an encrypted value
   * @param encryptedValue - The encrypted value to decrypt
   * @returns Decrypted string
   * @throws Error if decryption fails or encryption key is not set
   */
  decrypt(encryptedValue: string): string {
    if (!this.encryptionKey) {
      throw new Error(
        'Encryption key is required. Set ENV_ENCRYPTION_KEY or provide encryptionKey in options.'
      );
    }

    if (!encryptedValue) {
      return encryptedValue;
    }

    try {
      // Decode base64
      const combined = Buffer.from(encryptedValue, 'base64');

      // Extract components
      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(this.saltLength, this.tagPosition);
      const tag = combined.subarray(
        this.tagPosition,
        this.encryptedDataPosition
      );
      const encrypted = combined.subarray(this.encryptedDataPosition);

      // Derive key from encryption key and salt
      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        100000, // iterations
        32, // key length (256 bits)
        'sha256'
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      // Decrypt the value
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}. The encrypted value may be corrupted or encrypted with a different key.`
      );
    }
  }
}

export default EnvManager;
