"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
// Mock AWS SDK v3
jest.mock("@aws-sdk/client-secrets-manager", () => {
    const mockSend = jest.fn();
    return {
        SecretsManagerClient: jest.fn(() => ({
            send: mockSend
        })),
        GetSecretValueCommand: jest.fn()
    };
});
const cloudIntegration_1 = require("../src/cloudIntegration");
describe('Cloud Integration', () => {
    let mockClient;
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NODE_ENV = 'test';
        mockClient = new client_secrets_manager_1.SecretsManagerClient({});
    });
    afterEach(() => {
        delete process.env.NODE_ENV;
    });
    test('should fetch secrets from AWS Secrets Manager', async () => {
        // Setup mock response
        mockClient.send.mockResolvedValueOnce({
            SecretString: JSON.stringify({
                TEST_SECRET: 'test-value'
            })
        });
        const secrets = await (0, cloudIntegration_1.fetchCloudSecrets)();
        // Verify GetSecretValueCommand was created with correct params
        expect(client_secrets_manager_1.GetSecretValueCommand).toHaveBeenCalledWith({
            SecretId: 'default'
        });
        // Verify secrets were fetched
        expect(secrets).toHaveProperty('TEST_SECRET', 'test-value');
    });
    test('should handle AWS errors gracefully', async () => {
        // Setup mock error
        mockClient.send.mockRejectedValueOnce(new Error('AWS Error'));
        // Verify error is thrown in test environment
        await expect((0, cloudIntegration_1.fetchCloudSecrets)()).rejects.toThrow('AWS Error');
    });
    test('should handle missing SecretString', async () => {
        // Setup mock response without SecretString
        mockClient.send.mockResolvedValueOnce({});
        await expect((0, cloudIntegration_1.fetchCloudSecrets)()).rejects.toThrow('No secret string found');
    });
});
