import EnvManager from '../src/EnvManager';
import Joi from 'joi';

/**
 * AWS Secrets Manager integration example
 *
 * Prerequisites:
 * - AWS credentials configured (via AWS CLI, IAM role, or environment variables)
 * - AWS_REGION environment variable set
 * - AWS_SECRET_NAME environment variable set (or it will use 'default')
 */
async function cloudSecretsExample() {
  // Define your schema
  const schema = Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .required(),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().uri().required(),
    API_KEY: Joi.string().required(),
  });

  // Initialize the manager with cloud integration
  const envManager = new EnvManager({
    encryptionKey: process.env.ENV_ENCRYPTION_KEY,
    envPath: '.env',
    schema: schema,
    useCloud: true, // Enable AWS Secrets Manager integration
  });

  try {
    // Initialize - this will:
    // 1. Load local .env file
    // 2. Fetch secrets from AWS Secrets Manager
    // 3. Merge them (cloud secrets override local)
    // 4. Validate against schema
    const config = await envManager.initialize();
    console.log('Environment configured:', {
      NODE_ENV: config.NODE_ENV,
      PORT: config.PORT,
      DATABASE_URL: config.DATABASE_URL ? '***' : undefined,
      API_KEY: config.API_KEY ? '***' : undefined,
    });
  } catch (error) {
    console.error('Configuration error:', error);
    process.exit(1);
  }
}

cloudSecretsExample();
