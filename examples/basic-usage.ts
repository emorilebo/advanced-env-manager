import EnvManager from '../src/EnvManager';
import Joi from 'joi';

/**
 * Basic usage example
 */
async function basicExample() {
  // Define your schema
  const schema = Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .required(),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().uri().required(),
  });

  // Initialize the manager
  const envManager = new EnvManager({
    encryptionKey: process.env.ENV_ENCRYPTION_KEY || 'your-encryption-key',
    envPath: '.env',
    schema: schema,
    useCloud: false, // Set to true to use AWS Secrets Manager
  });

  try {
    // Initialize and validate
    const config = await envManager.initialize();
    console.log('Environment configured:', config);
    console.log('Port:', config.PORT);
    console.log('Database URL:', config.DATABASE_URL);
  } catch (error) {
    console.error('Configuration error:', error);
    process.exit(1);
  }
}

basicExample();
