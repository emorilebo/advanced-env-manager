"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const validator_1 = require("./validator");
const cloudIntegration_1 = require("./cloudIntegration");
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
    /**
     * Creates a new EnvManager instance
     * @param options - Configuration options for the environment manager
     */
    constructor(options = {}) {
        this.algorithm = 'aes-256-gcm';
        this.ivLength = 16;
        this.saltLength = 64;
        this.tagLength = 16;
        this.tagPosition = this.saltLength + this.ivLength;
        this.encryptedDataPosition = this.tagPosition + this.tagLength;
        this.encryptionKey =
            options.encryptionKey || process.env.ENV_ENCRYPTION_KEY || '';
        this.envPath = options.envPath || '.env';
        this.schema = options.schema;
        this.useCloud = options.useCloud || false;
        if (!this.encryptionKey &&
            (options.encryptionKey !== undefined || process.env.ENV_ENCRYPTION_KEY)) {
            console.warn('Warning: Encryption key is empty. Encrypt/decrypt functionality will not work properly.');
        }
    }
    /**
     * Initializes the environment manager by loading and validating environment variables
     * @returns Promise resolving to validated environment configuration
     * @throws Error if validation fails
     */
    async initialize() {
        // Load local environment variables
        if (fs_1.default.existsSync(this.envPath)) {
            const result = dotenv_1.default.config({ path: this.envPath });
            if (result.error) {
                console.warn(`Warning: Failed to load .env file from ${this.envPath}: ${result.error.message}`);
            }
        }
        let envConfig = { ...process.env };
        // Fetch and merge cloud secrets if enabled
        if (this.useCloud) {
            try {
                const cloudSecrets = await (0, cloudIntegration_1.fetchCloudSecrets)();
                envConfig = { ...envConfig, ...cloudSecrets };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.warn(`Failed to fetch cloud secrets: ${errorMessage}. Continuing with local environment variables only.`);
            }
        }
        // Validate if schema is provided
        if (this.schema) {
            envConfig = (0, validator_1.validateEnv)(envConfig, this.schema);
        }
        return envConfig;
    }
    /**
     * Encrypts a sensitive value using AES-256-GCM
     * @param value - The value to encrypt
     * @returns Encrypted string in format: salt:iv:tag:encryptedData (all base64 encoded)
     * @throws Error if encryption key is not set
     */
    encrypt(value) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key is required. Set ENV_ENCRYPTION_KEY or provide encryptionKey in options.');
        }
        if (!value) {
            return value;
        }
        try {
            // Generate salt for key derivation
            const salt = crypto_1.default.randomBytes(this.saltLength);
            // Derive key from encryption key and salt
            const key = crypto_1.default.pbkdf2Sync(this.encryptionKey, salt, 100000, // iterations
            32, // key length (256 bits)
            'sha256');
            // Generate IV
            const iv = crypto_1.default.randomBytes(this.ivLength);
            // Create cipher
            const cipher = crypto_1.default.createCipheriv(this.algorithm, key, iv);
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
        }
        catch (error) {
            throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Decrypts an encrypted value
     * @param encryptedValue - The encrypted value to decrypt
     * @returns Decrypted string
     * @throws Error if decryption fails or encryption key is not set
     */
    decrypt(encryptedValue) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key is required. Set ENV_ENCRYPTION_KEY or provide encryptionKey in options.');
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
            const tag = combined.subarray(this.tagPosition, this.encryptedDataPosition);
            const encrypted = combined.subarray(this.encryptedDataPosition);
            // Derive key from encryption key and salt
            const key = crypto_1.default.pbkdf2Sync(this.encryptionKey, salt, 100000, // iterations
            32, // key length (256 bits)
            'sha256');
            // Create decipher
            const decipher = crypto_1.default.createDecipheriv(this.algorithm, key, iv);
            decipher.setAuthTag(tag);
            // Decrypt the value
            let decrypted = decipher.update(encrypted, undefined, 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}. The encrypted value may be corrupted or encrypted with a different key.`);
        }
    }
}
exports.default = EnvManager;
