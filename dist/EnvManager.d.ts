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
declare class EnvManager {
    private encryptionKey;
    private envPath;
    private schema?;
    private useCloud;
    private readonly algorithm;
    private readonly ivLength;
    private readonly saltLength;
    private readonly tagLength;
    private readonly tagPosition;
    private readonly encryptedDataPosition;
    /**
     * Creates a new EnvManager instance
     * @param options - Configuration options for the environment manager
     */
    constructor(options?: EnvManagerOptions);
    /**
     * Initializes the environment manager by loading and validating environment variables
     * @returns Promise resolving to validated environment configuration
     * @throws Error if validation fails
     */
    initialize(): Promise<EnvConfig>;
    /**
     * Encrypts a sensitive value using AES-256-GCM
     * @param value - The value to encrypt
     * @returns Encrypted string in format: salt:iv:tag:encryptedData (all base64 encoded)
     * @throws Error if encryption key is not set
     */
    encrypt(value: string): string;
    /**
     * Decrypts an encrypted value
     * @param encryptedValue - The encrypted value to decrypt
     * @returns Decrypted string
     * @throws Error if decryption fails or encryption key is not set
     */
    decrypt(encryptedValue: string): string;
}
export default EnvManager;
