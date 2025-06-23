/**
 * Production-Ready Environment Manager
 * Enhanced with intelligent caching and comprehensive error handling
 */

import fs from 'fs';
import dotenv from 'dotenv';
import { validateEnv } from './validator';
import { 
  fetchCloudSecrets, 
  EnhancedCloudSecretsManager,
  CloudConfig 
} from './enhancedCloudIntegration';
import { EnvManagerOptions, EnvConfig } from './types';
import { 
  withRetry, 
  withTimeout,
  EnvManagerError, 
  ConfigurationError, 
  ValidationError,
  ErrorAggregator,
  DEFAULT_RETRY_CONFIG 
} from './errorHandling';
import { configCache, IntelligentCache } from './intelligentCache';

export interface ProductionEnvManagerOptions extends EnvManagerOptions {
  // Caching configuration
  enableCaching?: boolean;
  cacheTtl?: number;
  
  // Resilience configuration
  enableRetry?: boolean;
  retryConfig?: Partial<typeof DEFAULT_RETRY_CONFIG>;
  timeout?: number;
  
  // Cloud provider configurations
  cloudProviders?: Array<{
    name: string;
    config: CloudConfig;
  }>;
  
  // Validation configuration
  strictValidation?: boolean;
  allowUnknownKeys?: boolean;
  
  // Performance configuration
  enableMetrics?: boolean;
  enableHealthChecks?: boolean;
}

export interface EnvironmentMetrics {
  initializationTime: number;
  lastInitialized: Date;
  configurationSize: number;
  cacheHitRate: number;
  cloudProviderHealth: Record<string, boolean>;
  validationErrors: number;
  retryAttempts: number;
}

/**
 * Production-ready Environment Manager with enterprise features
 */
class ProductionEnvManager {
  private options: ProductionEnvManagerOptions;
  private cloudManager?: EnhancedCloudSecretsManager;
  private cache: IntelligentCache<EnvConfig>;
  private metrics: EnvironmentMetrics;
  private isInitialized: boolean = false;

  constructor(options: ProductionEnvManagerOptions = {}) {
    this.options = {
      // Inherit from base options
      encryptionKey: options.encryptionKey || process.env.ENV_ENCRYPTION_KEY || '',
      envPath: options.envPath || '.env',
      useCloud: options.useCloud || false,
      schema: options.schema,
      
      // Enhanced options with defaults
      enableCaching: options.enableCaching !== false, // Default true
      cacheTtl: options.cacheTtl || 5 * 60 * 1000, // 5 minutes
      enableRetry: options.enableRetry !== false, // Default true
      timeout: options.timeout || 30000, // 30 seconds
      strictValidation: options.strictValidation || false,
      allowUnknownKeys: options.allowUnknownKeys !== false, // Default true
      enableMetrics: options.enableMetrics !== false, // Default true
      enableHealthChecks: options.enableHealthChecks !== false, // Default true
      cloudProviders: options.cloudProviders,
      retryConfig: options.retryConfig
    };

    // Initialize intelligent cache
    this.cache = new IntelligentCache<EnvConfig>({
      maxSize: 10,
      defaultTtl: this.options.cacheTtl,
      maxMemoryUsage: 5 * 1024 * 1024, // 5MB
      cleanupInterval: 60000, // 1 minute
      enableMetrics: this.options.enableMetrics
    });

    // Initialize cloud manager if providers are configured
    if (this.options.cloudProviders && this.options.cloudProviders.length > 0) {
      this.cloudManager = new EnhancedCloudSecretsManager();
      for (const provider of this.options.cloudProviders) {
        this.cloudManager.addAWSProvider(provider.name, provider.config);
      }
    }

    // Initialize metrics
    this.metrics = {
      initializationTime: 0,
      lastInitialized: new Date(),
      configurationSize: 0,
      cacheHitRate: 0,
      cloudProviderHealth: {},
      validationErrors: 0,
      retryAttempts: 0
    };

    console.info('Production EnvManager initialized', {
      caching: this.options.enableCaching,
      cloudProviders: this.options.cloudProviders?.length || 0,
      retry: this.options.enableRetry,
      validation: !!this.options.schema,
      strictValidation: this.options.strictValidation
    });
  }

  /**
   * Initialize environment configuration with full resilience
   */
  async initialize(): Promise<EnvConfig> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey();
    const errorAggregator = new ErrorAggregator();

    try {
      console.debug('Starting environment configuration initialization');

      // Try cache first if enabled
      if (this.options.enableCaching) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          console.debug('Environment configuration loaded from cache');
          this.updateMetrics(cached, Date.now() - startTime, true);
          this.isInitialized = true;
          return cached;
        }
      }

      // Load configuration with full resilience stack
      const envConfig = await this.loadConfigurationWithResilience(errorAggregator);

      // Validate configuration if schema provided
      const validatedConfig = await this.validateConfiguration(envConfig, errorAggregator);

      // Cache the validated result
      if (this.options.enableCaching) {
        this.cache.set(cacheKey, validatedConfig, this.options.cacheTtl, ['env-config']);
        console.debug('Environment configuration cached successfully');
      }

      this.isInitialized = true;
      this.updateMetrics(validatedConfig, Date.now() - startTime, false);
      
      console.info('Environment configuration initialized successfully', {
        keys: Object.keys(validatedConfig).length,
        duration: Date.now() - startTime,
        fromCache: false,
        hasCloudSecrets: this.options.useCloud || !!this.cloudManager
      });

      return validatedConfig;

    } catch (error) {
      this.metrics.initializationTime = Date.now() - startTime;
      
      // Log aggregated errors for debugging
      if (errorAggregator.hasErrors()) {
        console.error('Multiple errors during initialization:', 
          errorAggregator.getErrors().map(e => e.toJSON())
        );
      }

      const configError = new ConfigurationError(
        `Failed to initialize environment configuration: ${(error as Error).message}`,
        {
          duration: Date.now() - startTime,
          aggregatedErrors: errorAggregator.getErrors().length,
          cacheEnabled: this.options.enableCaching,
          cloudEnabled: this.options.useCloud || !!this.cloudManager
        },
        error as Error
      );

      console.error('Environment initialization failed:', configError.toJSON());
      throw configError;
    }
  }

  /**
   * Refresh configuration (bypass cache and reload)
   */
  async refresh(): Promise<EnvConfig> {
    console.info('Refreshing environment configuration');
    
    // Clear local cache
    if (this.options.enableCaching) {
      this.cache.clear();
      console.debug('Local cache cleared');
    }

    // Invalidate cloud provider caches
    if (this.cloudManager) {
      this.cloudManager.invalidateAllCaches();
      console.debug('Cloud provider caches invalidated');
    }

    return await this.initialize();
  }

  /**
   * Get current configuration from cache
   */
  getConfig(): EnvConfig | null {
    if (!this.isInitialized) {
      console.warn('Environment manager not initialized, returning null');
      return null;
    }

    const cacheKey = this.generateCacheKey();
    return this.cache.get(cacheKey) || null;
  }

  /**
   * Get specific configuration value
   */
  getConfigValue(key: string, defaultValue?: any): any {
    const config = this.getConfig();
    return config?.[key] ?? defaultValue;
  }

  /**
   * Comprehensive health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, any>;
    metrics: EnvironmentMetrics;
  }> {
    const details: Record<string, any> = {
      initialized: this.isInitialized,
      cacheEnabled: this.options.enableCaching,
      cloudEnabled: !!this.cloudManager,
      retryEnabled: this.options.enableRetry,
      strictValidation: this.options.strictValidation
    };

    let healthy = this.isInitialized;

    // Check cache health
    if (this.options.enableCaching) {
      const cacheStats = this.cache.getStats();
      details.cache = {
        size: cacheStats.metrics.currentSize,
        hitRate: cacheStats.metrics.hitRate,
        memoryUsage: `${Math.round(cacheStats.metrics.currentMemoryUsage / 1024)}KB`
      };
    }

    // Check cloud provider health
    if (this.cloudManager && this.options.enableHealthChecks) {
      try {
        const cloudHealth = await withTimeout(
          () => this.cloudManager!.healthCheckAll(),
          10000, // 10 second timeout for health checks
          'Cloud Provider Health Check'
        );
        
        details.cloudProviders = cloudHealth;
        
        // Update metrics and overall health
        for (const [provider, health] of Object.entries(cloudHealth)) {
          this.metrics.cloudProviderHealth[provider] = health.healthy;
          if (!health.healthy) {
            healthy = false;
          }
        }
      } catch (error) {
        details.cloudProviders = { 
          error: (error as Error).message,
          healthy: false 
        };
        healthy = false;
      }
    }

    // Check configuration validity
    if (this.isInitialized) {
      const config = this.getConfig();
      details.configuration = {
        loaded: !!config,
        size: config ? Object.keys(config).length : 0
      };
      
      if (!config) {
        healthy = false;
      }
    }

    return {
      healthy,
      details,
      metrics: this.getMetrics()
    };
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics(): EnvironmentMetrics {
    // Update cache metrics if available
    if (this.options.enableCaching) {
      const cacheStats = this.cache.getStats();
      this.metrics.cacheHitRate = cacheStats.metrics.hitRate;
    }

    return { ...this.metrics };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Cleanup and destroy resources
   */
  destroy(): void {
    console.info('Destroying Production EnvManager');
    
    this.cache.destroy();
    this.isInitialized = false;
    
    console.info('Production EnvManager destroyed successfully');
  }

  // Private helper methods

  private async loadConfigurationWithResilience(errorAggregator: ErrorAggregator): Promise<EnvConfig> {
    const operation = async (): Promise<EnvConfig> => {
      let envConfig: EnvConfig = {};

      // Load local environment variables
      try {
        envConfig = await this.loadLocalEnvironment();
        console.debug(`Loaded ${Object.keys(envConfig).length} local environment variables`);
      } catch (error) {
        errorAggregator.add(error as Error, { source: 'local' });
        console.warn('Failed to load local environment, continuing with empty config');
      }

      // Fetch and merge cloud secrets if enabled
      if (this.options.useCloud || this.cloudManager) {
        try {
          const cloudSecrets = await this.loadCloudSecrets();
          const cloudKeyCount = Object.keys(cloudSecrets).length;
          
          if (cloudKeyCount > 0) {
            envConfig = { ...envConfig, ...cloudSecrets };
            console.debug(`Merged ${cloudKeyCount} cloud secrets`);
          }
        } catch (error) {
          errorAggregator.add(error as Error, { source: 'cloud' });
          
          if (this.options.strictValidation) {
            throw error;
          } else {
            console.warn('Failed to fetch cloud secrets, continuing with local config only');
          }
        }
      }

      return envConfig;
    };

    // Apply resilience patterns based on configuration
    if (this.options.enableRetry) {
      this.metrics.retryAttempts++;
      return await withTimeout(
        () => withRetry(operation, this.options.retryConfig, 'Environment Configuration Load'),
        this.options.timeout!,
        'Environment Configuration Load'
      );
    } else {
      return await withTimeout(operation, this.options.timeout!, 'Environment Configuration Load');
    }
  }

  private async loadLocalEnvironment(): Promise<EnvConfig> {
    if (this.options.envPath && fs.existsSync(this.options.envPath)) {
      const result = dotenv.config({ path: this.options.envPath });
      if (result.error) {
        throw new ConfigurationError(
          `Failed to load .env file: ${result.error.message}`,
          { envPath: this.options.envPath },
          result.error
        );
      }
    }

    return { ...process.env };
  }

  private async loadCloudSecrets(): Promise<EnvConfig> {
    if (this.cloudManager) {
      return await this.cloudManager.fetchAllSecrets();
    } else {
      return await fetchCloudSecrets();
    }
  }

  private async validateConfiguration(config: EnvConfig, errorAggregator: ErrorAggregator): Promise<EnvConfig> {
    if (!this.options.schema) {
      return config;
    }

    try {
      const validatedConfig = validateEnv(config, this.options.schema);
      console.debug('Configuration validation passed');
      return validatedConfig;
    } catch (error) {
      this.metrics.validationErrors++;
      errorAggregator.add(error as Error, { source: 'validation' });
      
      if (this.options.strictValidation) {
        throw new ValidationError(
          `Configuration validation failed: ${(error as Error).message}`,
          { 
            configKeys: Object.keys(config).length,
            strictMode: this.options.strictValidation 
          },
          error as Error
        );
      } else {
        console.warn('Configuration validation failed, proceeding with unvalidated config');
        return config;
      }
    }
  }

  private generateCacheKey(): string {
    const keyParts = [
      'env-config',
      this.options.envPath || 'default',
      this.options.useCloud ? 'cloud' : 'local'
    ];
    
    if (this.options.cloudProviders) {
      keyParts.push(...this.options.cloudProviders.map(p => p.name));
    }
    
    return keyParts.join(':');
  }

  private updateMetrics(config: EnvConfig, duration: number, fromCache: boolean): void {
    this.metrics.initializationTime = duration;
    this.metrics.lastInitialized = new Date();
    this.metrics.configurationSize = Object.keys(config).length;
    
    if (this.options.enableCaching && !fromCache) {
      const cacheStats = this.cache.getStats();
      this.metrics.cacheHitRate = cacheStats.metrics.hitRate;
    }
  }
}

export default ProductionEnvManager;
