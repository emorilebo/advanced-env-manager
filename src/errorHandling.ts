/**
 * Enhanced Error Handling and Resilience System
 * Production-ready error management with retry mechanisms and circuit breakers
 */

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  CLOUD_INTEGRATION = 'CLOUD_INTEGRATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  CONFIGURATION = 'CONFIGURATION'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Base error class with enhanced context and categorization
 */
export class EnvManagerError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly isRetryable: boolean;
  public readonly timestamp: Date;
  public readonly correlationId: string;
  public readonly context: Record<string, any>;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isRetryable: boolean = false,
    context: Record<string, any> = {},
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'EnvManagerError';
    this.category = category;
    this.severity = severity;
    this.isRetryable = isRetryable;
    this.timestamp = new Date();
    this.correlationId = this.generateCorrelationId();
    this.context = context;
    
    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnvManagerError);
    }
  }

  private generateCorrelationId(): string {
    return `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      context: this.context,
      originalError: this.originalError?.message,
      stack: this.stack
    };
  }
}

/**
 * Specific error classes for different scenarios
 */
export class CloudIntegrationError extends EnvManagerError {
  constructor(message: string, isRetryable: boolean = true, context: Record<string, any> = {}, originalError?: Error) {
    super(message, ErrorCategory.CLOUD_INTEGRATION, ErrorSeverity.MEDIUM, isRetryable, context, originalError);
  }
}

export class NetworkError extends EnvManagerError {
  constructor(message: string, context: Record<string, any> = {}, originalError?: Error) {
    super(message, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM, true, context, originalError);
  }
}

export class AuthenticationError extends EnvManagerError {
  constructor(message: string, context: Record<string, any> = {}, originalError?: Error) {
    super(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, false, context, originalError);
  }
}

export class ValidationError extends EnvManagerError {
  constructor(message: string, context: Record<string, any> = {}, originalError?: Error) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.HIGH, false, context, originalError);
  }
}

export class ConfigurationError extends EnvManagerError {
  constructor(message: string, context: Record<string, any> = {}, originalError?: Error) {
    super(message, ErrorCategory.CONFIGURATION, ErrorSeverity.HIGH, false, context, originalError);
  }
}

/**
 * Retry Configuration Interface
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: Error) => boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error: Error) => {
    // Default retry condition
    if (error instanceof EnvManagerError) {
      return error.isRetryable;
    }
    // Retry on network-related errors
    return error.message.includes('ECONNRESET') || 
           error.message.includes('ETIMEDOUT') ||
           error.message.includes('ENOTFOUND');
  }
};

/**
 * Enhanced retry mechanism with exponential backoff and jitter
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  operationName: string = 'operation'
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 1) {
        console.info(`${operationName} succeeded on attempt ${attempt} after ${Date.now() - startTime}ms`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (!retryConfig.retryCondition!(lastError)) {
        throw lastError;
      }

      // Don't retry on the last attempt
      if (attempt === retryConfig.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
        retryConfig.maxDelay
      );

      // Add jitter to prevent thundering herd
      if (retryConfig.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      console.warn(`${operationName} attempt ${attempt}/${retryConfig.maxAttempts} failed, retrying in ${Math.round(delay)}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Wrap the final error with additional context
  throw new EnvManagerError(
    `${operationName} failed after ${retryConfig.maxAttempts} attempts`,
    ErrorCategory.CLOUD_INTEGRATION,
    ErrorSeverity.HIGH,
    false,
    {
      attempts: retryConfig.maxAttempts,
      totalTime: Date.now() - startTime,
      operationName
    },
    lastError
  );
}

/**
 * Circuit Breaker Pattern Implementation
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  expectedErrors?: (error: Error) => boolean;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;

  constructor(private config: CircuitBreakerConfig) {
    this.config.expectedErrors = this.config.expectedErrors || (() => true);
  }

  async execute<T>(operation: () => Promise<T>, operationName: string = 'operation'): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new EnvManagerError(
          `Circuit breaker is OPEN for ${operationName}`,
          ErrorCategory.NETWORK,
          ErrorSeverity.MEDIUM,
          true,
          {
            state: this.state,
            failures: this.failures,
            nextAttemptTime: new Date(this.nextAttemptTime)
          }
        );
      } else {
        this.state = CircuitState.HALF_OPEN;
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(error: Error): void {
    if (this.config.expectedErrors!(error)) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      }
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime) : null,
      nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime) : null
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
}

/**
 * Timeout wrapper for operations
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  operationName: string = 'operation'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new EnvManagerError(
        `${operationName} timed out after ${timeoutMs}ms`,
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM,
        true,
        { timeout: timeoutMs, operationName }
      ));
    }, timeoutMs);

    operation()
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Utility function to determine if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof EnvManagerError) {
    return error.isRetryable;
  }

  // Common retryable error patterns
  const retryablePatterns = [
    /ECONNRESET/,
    /ETIMEDOUT/,
    /ENOTFOUND/,
    /ECONNREFUSED/,
    /socket hang up/,
    /network timeout/,
    /request timeout/,
    /502 Bad Gateway/,
    /503 Service Unavailable/,
    /504 Gateway Timeout/
  ];

  return retryablePatterns.some(pattern => pattern.test(error.message));
}

/**
 * Error aggregation for batch operations
 */
export class ErrorAggregator {
  private errors: EnvManagerError[] = [];

  add(error: Error, context?: Record<string, any>): void {
    if (error instanceof EnvManagerError) {
      this.errors.push(error);
    } else {
      this.errors.push(new EnvManagerError(
        error.message,
        ErrorCategory.CONFIGURATION,
        ErrorSeverity.MEDIUM,
        false,
        context || {},
        error
      ));
    }
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): EnvManagerError[] {
    return [...this.errors];
  }

  throwIfAny(): void {
    if (this.hasErrors()) {
      throw new EnvManagerError(
        `Multiple errors occurred: ${this.errors.map(e => e.message).join('; ')}`,
        ErrorCategory.CONFIGURATION,
        ErrorSeverity.HIGH,
        false,
        {
          errorCount: this.errors.length,
          errors: this.errors.map(e => e.toJSON())
        }
      );
    }
  }

  clear(): void {
    this.errors = [];
  }
}
