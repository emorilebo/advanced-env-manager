"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCloudSecrets = exports.initAWS = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
/**
 * Initializes and returns an AWS Secrets Manager client
 * @param region - AWS region (defaults to us-east-1 or from AWS_REGION env var)
 * @returns Configured SecretsManagerClient instance
 */
function initAWS(region) {
    const awsRegion = region || process.env.AWS_REGION || 'us-east-1';
    return new client_secrets_manager_1.SecretsManagerClient({ region: awsRegion });
}
exports.initAWS = initAWS;
/**
 * Fetches secrets from AWS Secrets Manager
 * @param secretName - Optional secret name (defaults to AWS_SECRET_NAME env var or 'default')
 * @param region - Optional AWS region
 * @returns Promise resolving to an object containing the secrets
 * @throws Error if secret fetching fails in test environment, otherwise returns empty object
 */
async function fetchCloudSecrets(secretName, region) {
    try {
        const secretsManager = initAWS(region);
        const secretId = secretName || process.env.AWS_SECRET_NAME || 'default';
        const input = {
            SecretId: secretId,
        };
        const command = new client_secrets_manager_1.GetSecretValueCommand(input);
        const response = await secretsManager.send(command);
        if (!response.SecretString) {
            throw new Error(`No secret string found for secret: ${secretId}`);
        }
        return JSON.parse(response.SecretString);
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        // In test environment, throw errors to allow proper testing
        if (process.env.NODE_ENV === 'test') {
            throw err instanceof Error ? err : new Error(errorMessage);
        }
        // In production, log warning and return empty object to allow graceful degradation
        console.warn(`Failed to fetch cloud secrets: ${errorMessage}. Continuing with local environment variables only.`);
        return {};
    }
}
exports.fetchCloudSecrets = fetchCloudSecrets;
