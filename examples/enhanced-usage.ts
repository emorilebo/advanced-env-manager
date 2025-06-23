/**
 * Enhanced Usage Examples for Advanced Environment Manager
 * Demonstrates production-ready patterns with error handling and caching
 */

import ProductionEnvManager from '../src/ProductionEnvManager';
import { EnhancedAWSSecretsManager } from '../src/enhancedCloudIntegration';
import { secretsCache, configCache } from '../src/intelligentCache';
import { withRetry, CircuitBreaker } from '../src/errorHandling';
import Joi from 'joi';

// Example 1: Basic Enhanced Usage
export async function basicEnhancedUsage() {
  console.log('=== Basic Enhanced Usage ===');
  
  const envManager = new ProductionEnvManager({
    envPath: '.env',
    enableCaching: true,
    enableRetry: true,
    timeout: 15000,
    strictValidation: false
  });

  try {
    const config = await envManager.initialize();
    console.log('Configuration loaded:', {
      keys: Object.keys(config).length,
      nodeEnv: config.NODE_ENV,
      port: config.PORT
    });

    // Get specific values
    const dbUrl = envManager.getConfigValue('DATABASE_URL', 'sqlite://default.db');
    console.log('Database URL:', dbUrl);

    // Health check
    const health = await envManager.healthCheck();
    console.log('Health status:', health.healthy);
    console.log('Metrics:', health.metrics);

  } catch (error) {
    console.error('Failed to initialize:', error);
  } finally {
    envManager.destroy();
  }
}

// Example 2: Advanced Usage with Validation and Cloud Integration
export async function advancedUsageWithValidation() {
  console.log('=== Advanced Usage with Validation ===');

  // Define comprehensive validation schema
  const schema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
    PORT: Joi.number().port().default(3000),
    DATABASE_URL: Joi.string().uri().required(),
    API_KEY: Joi.string().min(32).required(),
    JWT_SECRET: Joi.string().min(32).required(),
    REDIS_URL: Joi.string().uri().optional(),
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info')
  });

  const envManager = new ProductionEnvManager({
    envPath: '.env',
    schema,
    useCloud: true,
    enableCaching: true,
    cacheTtl: 10 * 60 * 1000, // 10 minutes
    enableRetry: true,
    retryConfig: {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 30000
    },
    timeout: 30000,
    strictValidation: true, // Fail fast on validation errors
    enableMetrics: true,
    enableHealthChecks: true
  });

  try {
    console.log('Initializing with strict validation...');
    const config = await envManager.initialize();
    
    console.log('✅ Configuration validated and loaded:', {
      environment: config.NODE_ENV,
      port: config.PORT,
      hasApiKey: !!config.API_KEY,
      hasJwtSecret: !!config.JWT_SECRET,
      logLevel: config.LOG_LEVEL
    });

    // Demonstrate refresh capability
    console.log('Refreshing configuration...');
    const refreshedConfig = await envManager.refresh();
    console.log('✅ Configuration refreshed');

    // Get comprehensive metrics
    const metrics = envManager.getMetrics();
    console.log('Performance metrics:', {
      initTime: `${metrics.initializationTime}ms`,
      configSize: metrics.configurationSize,
      cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
      validationErrors: metrics.validationErrors
    });

  } catch (error) {
    console.error('❌ Advanced initialization failed:', error);
  } finally {
    envManager.destroy();
  }
}

// Example 3: Multi-Cloud Provider Setup
export async function multiCloudProviderUsage() {
  console.log('=== Multi-Cloud Provider Usage ===');

  const envManager = new ProductionEnvManager({
    envPath: '.env',
    enableCaching: true,
    cloudProviders: [
      {
        name: 'primary-aws',
        config: {
          provider: 'aws',
          secretName: 'prod-secrets',
          region: 'us-east-1',
          timeout: 10000,
          cacheConfig: {
            ttl: 15 * 60 * 1000,
            tags: ['aws', 'primary'],
            enableCache: true
          }
        }
      },
      {
        name: 'secondary-aws',
        config: {
          provider: 'aws',
          secretName: 'backup-secrets',
          region: 'us-west-2',
          timeout: 10000,
          cacheConfig: {
            ttl: 20 * 60 * 1000,
            tags: ['aws', 'secondary'],
            enableCache: true
          }
        }
      }
    ],
    enableRetry: true,
    strictValidation: false // Allow partial failures
  });

  try {
    const config = await envManager.initialize();
    console.log('✅ Multi-cloud configuration loaded');

    // Comprehensive health check
    const health = await envManager.healthCheck();
    console.log('Cloud provider health:', health.details.cloudProviders);

    // Cache statistics
    const cacheStats = envManager.getCacheStats();
    console.log('Cache performance:', {
      hitRate: `${(cacheStats.metrics.hitRate * 100).toFixed(1)}%`,
      memoryUsage: `${Math.round(cacheStats.metrics.currentMemoryUsage / 1024)}KB`,
      entries: cacheStats.metrics.currentSize
    });

  } catch (error) {
    console.error('❌ Multi-cloud setup failed:', error);
  } finally {
    envManager.destroy();
  }
}

// Example 4: Direct AWS Secrets Manager Usage
export async function directAWSUsage() {
  console.log('=== Direct AWS Secrets Manager Usage ===');

  const awsManager = new EnhancedAWSSecretsManager({
    provider: 'aws',
    secretName: 'my-app-secrets',
    region: 'us-east-1',
    timeout: 15000,
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000
    },
    cacheConfig: {
      ttl: 20 * 60 * 1000, // 20 minutes
      enableCache: true,
      tags: ['aws', 'direct']
    },
    circuitBreakerConfig: {
      failureThreshold: 3,
      recoveryTimeout: 30000
    }
  });

  try {
    console.log('Fetching secrets from AWS...');
    const secrets = await awsManager.fetchSecrets();
    console.log('✅ Secrets fetched:', Object.keys(secrets).length, 'keys');

    // Health check
    const health = await awsManager.healthCheck();
    console.log('AWS health:', health.healthy ? '✅ Healthy' : '❌ Unhealthy');

    // Circuit breaker stats
    const cbStats = awsManager.getCircuitBreakerStats();
    console.log('Circuit breaker state:', cbStats.state);

  } catch (error) {
    console.error('❌ AWS secrets fetch failed:', error);
  }
}

// Example 5: Advanced Caching Patterns
export async function advancedCachingPatterns() {
  console.log('=== Advanced Caching Patterns ===');

  // Direct cache usage
  console.log('Setting up cache entries...');
  
  // Cache with TTL and tags
  secretsCache.set('api:keys', { apiKey: 'secret123' }, 5 * 60 * 1000, ['api', 'secrets']);
  configCache.set('app:settings', { theme: 'dark', lang: 'en' }, 60 * 60 * 1000, ['app', 'ui']);

  // Get or set pattern
  const dbConfig = await secretsCache.getOrSet(
    'database:config',
    async () => {
      console.log('Fetching database config...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      return { host: 'localhost', port: 5432, ssl: true };
    },
    10 * 60 * 1000, // 10 minutes
    ['database', 'config']
  );

  console.log('Database config:', dbConfig);

  // Cache statistics
  const secretsStats = secretsCache.getStats();
  const configStats = configCache.getStats();

  console.log('Secrets cache stats:', {
    hitRate: `${(secretsStats.metrics.hitRate * 100).toFixed(1)}%`,
    entries: secretsStats.metrics.currentSize,
    memoryUsage: `${Math.round(secretsStats.metrics.currentMemoryUsage / 1024)}KB`
  });

  console.log('Config cache stats:', {
    hitRate: `${(configStats.metrics.hitRate * 100).toFixed(1)}%`,
    entries: configStats.metrics.currentSize
  });

  // Tag-based invalidation
  console.log('Invalidating API-related cache entries...');
  const invalidated = secretsCache.invalidateByTags(['api']);
  console.log(`Invalidated ${invalidated} entries`);
}

// Example 6: Error Handling and Resilience Patterns
export async function errorHandlingPatterns() {
  console.log('=== Error Handling and Resilience Patterns ===');

  // Retry pattern
  const result = await withRetry(
    async () => {
      // Simulate unreliable operation
      if (Math.random() < 0.7) {
        throw new Error('Simulated failure');
      }
      return 'Success!';
    },
    {
      maxAttempts: 5,
      baseDelay: 1000,
      backoffMultiplier: 2,
      jitter: true
    },
    'Simulated Operation'
  );

  console.log('Retry result:', result);

  // Circuit breaker pattern
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 5000,
    monitoringPeriod: 10000
  });

  for (let i = 0; i < 5; i++) {
    try {
      const result = await circuitBreaker.execute(async () => {
        // Simulate failing service
        if (Math.random() < 0.8) {
          throw new Error(`Service failure ${i + 1}`);
        }
        return `Success ${i + 1}`;
      }, `Operation ${i + 1}`);
      
      console.log(`✅ ${result}`);
    } catch (error) {
      console.log(`❌ Operation ${i + 1} failed:`, error.message);
    }
  }

  console.log('Final circuit breaker state:', circuitBreaker.getState());
}

// Example 7: Production Monitoring Setup
export async function productionMonitoringSetup() {
  console.log('=== Production Monitoring Setup ===');

  const envManager = new ProductionEnvManager({
    envPath: '.env',
    enableCaching: true,
    enableMetrics: true,
    enableHealthChecks: true,
    useCloud: true,
    enableRetry: true
  });

  try {
    // Initialize
    await envManager.initialize();

    // Set up periodic health checks (in production, use a proper scheduler)
    const healthCheckInterval = setInterval(async () => {
      const health = await envManager.healthCheck();
      
      console.log(`Health Check [${new Date().toISOString()}]:`, {
        status: health.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY',
        initTime: `${health.metrics.initializationTime}ms`,
        cacheHitRate: `${(health.metrics.cacheHitRate * 100).toFixed(1)}%`,
        configSize: health.metrics.configurationSize
      });

      // In production, send these metrics to your monitoring system
      // e.g., CloudWatch, Datadog, Prometheus, etc.
      
    }, 30000); // Every 30 seconds

    // Simulate running for a while
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    clearInterval(healthCheckInterval);
    console.log('Monitoring simulation completed');

  } catch (error) {
    console.error('❌ Monitoring setup failed:', error);
  } finally {
    envManager.destroy();
  }
}

// Run examples
async function runAllExamples() {
  try {
    await basicEnhancedUsage();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await advancedUsageWithValidation();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await multiCloudProviderUsage();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await directAWSUsage();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await advancedCachingPatterns();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await errorHandlingPatterns();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await productionMonitoringSetup();
    
  } catch (error) {
    console.error('Example execution failed:', error);
  }
}

// Export for use
export {
  basicEnhancedUsage,
  advancedUsageWithValidation,
  multiCloudProviderUsage,
  directAWSUsage,
  advancedCachingPatterns,
  errorHandlingPatterns,
  productionMonitoringSetup,
  runAllExamples
};

// Run if called directly
if (require.main === module) {
  runAllExamples();
}
