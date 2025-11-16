import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { CloudSecrets } from './types';
/**
 * Initializes and returns an AWS Secrets Manager client
 * @param region - AWS region (defaults to us-east-1 or from AWS_REGION env var)
 * @returns Configured SecretsManagerClient instance
 */
export declare function initAWS(region?: string): SecretsManagerClient;
/**
 * Fetches secrets from AWS Secrets Manager
 * @param secretName - Optional secret name (defaults to AWS_SECRET_NAME env var or 'default')
 * @param region - Optional AWS region
 * @returns Promise resolving to an object containing the secrets
 * @throws Error if secret fetching fails in test environment, otherwise returns empty object
 */
export declare function fetchCloudSecrets(secretName?: string, region?: string): Promise<CloudSecrets>;
