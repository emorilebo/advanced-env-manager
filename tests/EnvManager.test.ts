import EnvManager from '../src/EnvManager';
import fs from 'fs';
import Joi from 'joi';

jest.mock('fs');
jest.mock('../src/cloudIntegration');

describe('EnvManager', () => {
  let envManager: EnvManager;
  const testSchema = Joi.object({
    TEST_VAR: Joi.string().required(),
  });

  beforeEach(() => {
    process.env.TEST_VAR = 'test-value';
    envManager = new EnvManager({
      envPath: '.env.test',
      schema: testSchema,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.TEST_VAR;
  });

  test('should create instance of EnvManager', () => {
    expect(envManager).toBeInstanceOf(EnvManager);
  });

  test('should initialize with local environment variables', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const config = await envManager.initialize();
    expect(config.TEST_VAR).toBe('test-value');
  });

  test('should validate environment variables against schema', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    delete process.env.TEST_VAR;
    await expect(envManager.initialize()).rejects.toThrow();
  });

  describe('Encryption/Decryption', () => {
    const encryptionKey = 'my-test-encryption-key-32-chars-long!!';

    test('should encrypt and decrypt a value', () => {
      const manager = new EnvManager({ encryptionKey });
      const originalValue = 'my-secret-password-123';

      const encrypted = manager.encrypt(originalValue);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(originalValue);

      const decrypted = manager.decrypt(encrypted);
      expect(decrypted).toBe(originalValue);
    });

    test('should throw error when encrypting without encryption key', () => {
      const manager = new EnvManager();
      expect(() => manager.encrypt('test')).toThrow(
        'Encryption key is required'
      );
    });

    test('should throw error when decrypting without encryption key', () => {
      const manager = new EnvManager();
      expect(() => manager.decrypt('encrypted-value')).toThrow(
        'Encryption key is required'
      );
    });

    test('should handle empty strings', () => {
      const manager = new EnvManager({ encryptionKey });
      expect(manager.encrypt('')).toBe('');
      expect(manager.decrypt('')).toBe('');
    });

    test('should produce different encrypted values for same input', () => {
      const manager = new EnvManager({ encryptionKey });
      const value = 'same-value';
      const encrypted1 = manager.encrypt(value);
      const encrypted2 = manager.encrypt(value);

      // Should be different due to random salt and IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      expect(manager.decrypt(encrypted1)).toBe(value);
      expect(manager.decrypt(encrypted2)).toBe(value);
    });

    test('should throw error when decrypting with wrong key', () => {
      const manager1 = new EnvManager({ encryptionKey: 'key1' });
      const manager2 = new EnvManager({ encryptionKey: 'key2' });

      const encrypted = manager1.encrypt('test-value');
      expect(() => manager2.decrypt(encrypted)).toThrow('Decryption failed');
    });

    test('should throw error when decrypting corrupted data', () => {
      const manager = new EnvManager({ encryptionKey });
      expect(() => manager.decrypt('invalid-base64-data!!!')).toThrow(
        'Decryption failed'
      );
    });
  });
});
