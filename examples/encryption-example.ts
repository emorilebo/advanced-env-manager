import EnvManager from '../src/EnvManager';

/**
 * Encryption/Decryption example
 */
function encryptionExample() {
  // Initialize the manager with encryption key
  const envManager = new EnvManager({
    encryptionKey: 'my-super-secret-encryption-key-32-chars!!',
    envPath: '.env',
  });

  try {
    // Encrypt sensitive data
    const sensitiveValue = 'my-secret-password-123';
    const encrypted = envManager.encrypt(sensitiveValue);
    console.log('Original:', sensitiveValue);
    console.log('Encrypted:', encrypted);

    // Decrypt when needed
    const decrypted = envManager.decrypt(encrypted);
    console.log('Decrypted:', decrypted);
    console.log('Match:', sensitiveValue === decrypted);
  } catch (error) {
    console.error('Encryption error:', error);
  }
}

encryptionExample();
