/**
 * Enhanced Cloud Integration with Error Handling and Intelligent Caching
 * Production-ready cloud secrets management with resilience and performance
 */

import AWS from 'aws-sdk';
import { CloudSecrets } from './types';
import { 
  withRetry, 
  withTimeout, 
  CircuitBreaker, 
  CloudIntegrationError, 
  NetworkError, 
  AuthenticationError,
  DEFAULT_RETRY_CONFIG 
} from './errorHandling';
import { secretsCache } from './intelligentCache';

export interface CloudConfig {
  provider: 'aws' | 'azure' | 'gcp';
  region?: string;
  secretName: string;
  timeout?: number;
  retryConfig?: Partial<typeof DEFAULT_RETRY_CONFIG>;
  cacheConfig?: {
    ttl?: number;
    tags?: string[];
    enableCache?: boolean;
  };
  circuitBreakerConfig?: {
    failureThreshold?: number;
    recoveryTimeout?: number;
  };
}

/**
 * Enhanced AWS Secrets Manager integration
 */
export class EnhancedAWSSecretsManager {
  private secretsManager: AWS.SecretsManager;
  private circuitBreaker: CircuitBreaker;
  private config: CloudConfig;

  constructor(config: CloudConfig) {
    this.config = {
      timeout: 10000, // 10 seconds default
      cacheConfig: {
        ttl: 15 * 60 * 1000, // 15 minutes default
        enableCache: true,
        tags: ['aws', 'secrets']
      },
      circuitBreakerConfig: {
        failureThreshold: 5,
        recoveryTimeout: 60000 // 1 minute
      },
      ...config
    };

    // Initialize AWS SDK
    AWS.config.update({ 
      region: this.config.region || process.env.AWS_REGION || 'us-east-1',
      maxRetries: 0 // We handle retries ourselves
    });
    this.secretsManager = new AWS.SecretsManager();

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: this.config.circuitBreakerConfig!.failureThreshold!,
      recoveryTimeout: this.config.circuitBreakerConfig!.recoveryTimeout!,
      monitoringPeriod: 60000,
      expectedErrors: (error: Error) => {
        // Don't trip circuit breaker for authentication errors
        return !(error instanceof AuthenticationError);
      }
    });
  }

  /**
   * Fetch secrets with enhanced error handling and caching
   */
  async fetchSecrets(): Promise<CloudSecrets> {
    const cacheKey = `aws:secrets:${this.config.secretName}:${this.config.region}`;
    
    // Try cache first if enabled
    if (this.config.cacheConfig?.enableCache) {
      const cached = secretsCache.get(cacheKey);
      if (cached) {
        console.debug(`Cache hit for AWS secrets: ${this.config.secretName}`);
        return cached;
      }
    }

    // Fetch from AWS with full resilience stack
    const secrets = await this.circuitBreaker.execute(async () => {
      return await withTimeout(
        () => withRetry(
          () => this.fetchFromAWS(),
          this.config.retryConfig,
          `AWS Secrets Manager (${this.config.secretName})`
        ),
        this.config.timeout!,
        `AWS Secrets Manager timeout (${this.config.secretName})`
      );
    }, `AWS Secrets Manager (${this.config.secretName})`);

    // Cache the result if enabled
    if (this.config.cacheConfig?.enableCache) {
      secretsCache.set(
        cacheKey,
        secrets,
        this.config.cacheConfig.ttl,
        this.config.cacheConfig.tags
      );
      console.debug(`Cached AWS secrets: ${this.config.secretName}`);
    }

    return secrets;
  }

  /**
   * Health check for AWS Secrets Manager
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const startTime = Date.now();
      
      await withTimeout(
        async () => {
          // Simple list operation to check connectivity
          await this.secretsManager.listSecrets({ MaxResults: 1 }).promise();
        },
        5000, // 5 second timeout for health check
        'AWS Secrets Manager health check'
      );

      const responseTime = Date.now() - startTime;
      
      return {
        healthy: true,
        details: {
          provider: 'aws',
          region: this.config.region,
          responseTime,
          circuitBreakerState: this.circuitBreaker.getState(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          provider: 'aws',
          region: this.config.region,
          error: error instanceof Error ? error.message : 'Unknown error',
          circuitBreakerState: this.circuitBreaker.getState(),
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Invalidate cache for this secrets manager
   */
  invalidateCache(): void {
    const cacheKey = `aws:secrets:${this.config.secretName}:${this.config.region}`;
    secretsCache.delete(cacheKey);
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  private async fetchFromAWS(): Promise<CloudSecrets> {
    try {
      console.debug(`Fetching secrets from AWS: ${this.config.secretName}`);
      
      const data = await this.secretsManager
        .getSecretValue({
          SecretId: this.config.secretName,
        })
        .promise();

      if (!data.SecretString) {
        throw new CloudIntegrationError(
          'No secret string found in AWS response',
          false,
          { secretName: this.config.secretName, region: this.config.region }
        );
      }

      const secrets = JSON.parse(data.SecretString);
      console.info(`Successfully fetched ${Object.keys(secrets).length} secrets from AWS`);
      
      return secrets;
    } catch (error) {
      const awsError = error as AWS.AWSError;
      
      // Categorize AWS errors appropriately
      if (awsError.code === 'UnauthorizedOperation' || awsError.code === 'AccessDenied') {
        throw new AuthenticationError(
          `AWS authentication failed: ${awsError.message}`,
          { 
            secretName: this.config.secretName, 
            region: this.config.region,
            awsErrorCode: awsError.code 
          },
          awsError
        );
      }
      
      if (awsError.code === 'ResourceNotFoundException') {
        throw new CloudIntegrationError(
          `Secret not found: ${this.config.secretName}`,
          false,
          { 
            secretName: this.config.secretName, 
            region: this.config.region,
            awsErrorCode: awsError.code 
          },
          awsError
        );
      }

      if (awsError.code === 'ThrottlingException' || awsError.code === 'TooManyRequestsException') {
        throw new CloudIntegrationError(
          `AWS API throttling: ${awsError.message}`,
          true,
          { 
            secretName: this.config.secretName, 
            region: this.config.region,
            awsErrorCode: awsError.code 
          },
          awsError
        );
      }

      // Network-related errors
      if (awsError.code === 'NetworkingError' || awsError.code === 'TimeoutError') {
        throw new NetworkError(
          `AWS network error: ${awsError.message}`,
          { 
            secretName: this.config.secretName, 
            region: this.config.region,
            awsErrorCode: awsError.code 
          },
          awsError
        );
      }

      // Generic cloud integration error for other cases
      throw new CloudIntegrationError(
        `AWS Secrets Manager error: ${awsError.message}`,
        true,
        { 
          secretName: this.config.secretName, 
          region: this.config.region,
          awsErrorCode: awsError.code 
        },
        awsError
      );
    }
  }
}

/**
 * Enhanced cloud secrets manager with multi-provider support
 */
export class EnhancedCloudSecretsManager {
  private providers: Map<string, EnhancedAWSSecretsManager> = new Map();

  /**
   * Add AWS provider
   */
  addAWSProvider(name: string, config: CloudConfig): void {
    this.providers.set(name, new EnhancedAWSSecretsManager(config));
  }

  /**
   * Fetch secrets from specific provider
   */
  async fetchSecrets(providerName: string): Promise<CloudSecrets> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new CloudIntegrationError(
        `Provider not found: ${providerName}`,
        false,
        { providerName, availableProviders: Array.from(this.providers.keys()) }
      );
    }

    return await provider.fetchSecrets();
  }

  /**
   * Fetch secrets from all providers and merge
   */
  async fetchAllSecrets(): Promise<CloudSecrets> {
    const allSecrets: CloudSecrets = {};
    const errors: Error[] = [];

    for (const [name, provider] of this.providers.entries()) {
      try {
        const secrets = await provider.fetchSecrets();
        Object.assign(allSecrets, secrets);
        console.info(`Successfully fetched secrets from provider: ${name}`);
      } catch (error) {
        console.error(`Failed to fetch secrets from provider ${name}:`, error);
        errors.push(error as Error);
      }
    }

    // If all providers failed, throw the last error
    if (Object.keys(allSecrets).length === 0 && errors.length > 0) {
      throw errors[errors.length - 1];
    }

    return allSecrets;
  }

  /**
   * Health check for all providers
   */
  async healthCheckAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        results[name] = await provider.healthCheck();
      } catch (error) {
        results[name] = {
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }

  /**
   * Invalidate cache for all providers
   */
  invalidateAllCaches(): void {
    for (const provider of this.providers.values()) {
      provider.invalidateCache();
    }
  }

  /**
   * Get statistics for all providers
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      stats[name] = {
        circuitBreaker: provider.getCircuitBreakerStats()
      };
    }

    return stats;
  }
}

// Backward compatibility - enhanced version of original function
export async function fetchCloudSecrets(): Promise<CloudSecrets> {
  const config: CloudConfig = {
    provider: 'aws',
    secretName: process.env.AWS_SECRET_NAME || 'default',
    region: process.env.AWS_REGION,
    timeout: process.env.CLOUD_TIMEOUT ? parseInt(process.env.CLOUD_TIMEOUT) : undefined,
    cacheConfig: {
      enableCache: process.env.DISABLE_SECRETS_CACHE !== 'true',
      ttl: process.env.SECRETS_CACHE_TTL ? parseInt(process.env.SECRETS_CACHE_TTL) : undefined
    }
  };

  const manager = new EnhancedAWSSecretsManager(config);
  return await manager.fetchSecrets();
}

// Legacy function for backward compatibility
export const initAWS = (): AWS.SecretsManager => {
  AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
  return new AWS.SecretsManager();
};

// Export enhanced manager for advanced usage
export { EnhancedAWSSecretsManager, EnhancedCloudSecretsManager };
