import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandInput,
} from '@aws-sdk/client-secrets-manager';
import { CloudSecrets } from './types';

/**
 * Initializes and returns an AWS Secrets Manager client
 * @param region - AWS region (defaults to us-east-1 or from AWS_REGION env var)
 * @returns Configured SecretsManagerClient instance
 */
export function initAWS(region?: string): SecretsManagerClient {
  const awsRegion = region || process.env.AWS_REGION || 'us-east-1';
  return new SecretsManagerClient({ region: awsRegion });
}

/**
 * Fetches secrets from AWS Secrets Manager
 * @param secretName - Optional secret name (defaults to AWS_SECRET_NAME env var or 'default')
 * @param region - Optional AWS region
 * @returns Promise resolving to an object containing the secrets
 * @throws Error if secret fetching fails in test environment, otherwise returns empty object
 */
export async function fetchCloudSecrets(
  secretName?: string,
  region?: string
): Promise<CloudSecrets> {
  try {
    const secretsManager = initAWS(region);
    const secretId = secretName || process.env.AWS_SECRET_NAME || 'default';

    const input: GetSecretValueCommandInput = {
      SecretId: secretId,
    };

    const command = new GetSecretValueCommand(input);
    const response = await secretsManager.send(command);

    if (!response.SecretString) {
      throw new Error(`No secret string found for secret: ${secretId}`);
    }

    return JSON.parse(response.SecretString) as CloudSecrets;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred';

    // In test environment, throw errors to allow proper testing
    if (process.env.NODE_ENV === 'test') {
      throw err instanceof Error ? err : new Error(errorMessage);
    }

    // In production, log warning and return empty object to allow graceful degradation
    console.warn(
      `Failed to fetch cloud secrets: ${errorMessage}. Continuing with local environment variables only.`
    );
    return {};
  }
}
