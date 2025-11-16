import {
  SecretsManagerClient as MockSecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { fetchCloudSecrets, initAWS } from '../src/cloudIntegration';

// Mock AWS SDK v3
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-secrets-manager', () => {
  return {
    SecretsManagerClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    GetSecretValueCommand: jest.fn().mockImplementation((input) => input),
  };
});

describe('Cloud Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_SECRET_NAME = 'test-secret';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.AWS_REGION;
    delete process.env.AWS_SECRET_NAME;
  });

  test('should initialize AWS client with correct region', () => {
    initAWS('us-west-2');
    expect(MockSecretsManagerClient).toHaveBeenCalledWith({
      region: 'us-west-2',
    });
  });

  test('should initialize AWS client with default region', () => {
    initAWS();
    expect(MockSecretsManagerClient).toHaveBeenCalledWith({
      region: 'us-east-1',
    });
  });

  test('should fetch secrets from AWS Secrets Manager', async () => {
    // Setup mock response
    mockSend.mockResolvedValue({
      SecretString: JSON.stringify({
        TEST_SECRET: 'test-value',
      }),
    });

    const secrets = await fetchCloudSecrets();

    // Verify GetSecretValueCommand was created with correct input
    expect(GetSecretValueCommand).toHaveBeenCalledWith({
      SecretId: 'test-secret',
    });

    // Verify secrets were fetched
    expect(secrets).toHaveProperty('TEST_SECRET', 'test-value');
  });

  test('should use default secret name when not provided', async () => {
    delete process.env.AWS_SECRET_NAME;
    mockSend.mockResolvedValue({
      SecretString: JSON.stringify({
        TEST_SECRET: 'test-value',
      }),
    });

    await fetchCloudSecrets();

    expect(GetSecretValueCommand).toHaveBeenCalledWith({
      SecretId: 'default',
    });
  });

  test('should handle AWS errors gracefully in test environment', async () => {
    // Setup mock error
    mockSend.mockRejectedValue(new Error('AWS Error'));

    // Verify error is thrown in test environment
    await expect(fetchCloudSecrets()).rejects.toThrow('AWS Error');
  });

  test('should handle missing SecretString', async () => {
    // Setup mock response without SecretString
    mockSend.mockResolvedValue({});

    await expect(fetchCloudSecrets()).rejects.toThrow(
      'No secret string found for secret'
    );
  });

  test('should accept custom secret name and region', async () => {
    mockSend.mockResolvedValue({
      SecretString: JSON.stringify({
        CUSTOM_SECRET: 'custom-value',
      }),
    });

    const secrets = await fetchCloudSecrets('custom-secret', 'eu-west-1');

    expect(GetSecretValueCommand).toHaveBeenCalledWith({
      SecretId: 'custom-secret',
    });
    expect(MockSecretsManagerClient).toHaveBeenCalledWith({
      region: 'eu-west-1',
    });
    expect(secrets).toHaveProperty('CUSTOM_SECRET', 'custom-value');
  });
});
