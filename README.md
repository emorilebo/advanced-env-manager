# Advanced Environment Manager

This package enhances environment variable management by adding validation, type checking, and cloud integration, making projects more secure.

## Features

- Environment variable validation with Joi schemas
- AWS Secrets Manager integration
- Environment variable encryption
- Multiple environment support
- Type checking and default values

## Installation

```sh
npm install advanced-env-manager
```

## Usage

```javascript
const EnvManager = require('advanced-env-manager');
const Joi = require('joi');

// Define your schema
const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
});

// Initialize the manager
const envManager = new EnvManager({
  encryptionKey: 'your-encryption-key',
  envPath: '.env',
  schema: schema,
  useCloud: true // Set to true to use AWS Secrets Manager
});

// Use the manager
async function start() {
  try {
    const config = await envManager.initialize();
    console.log('Environment configured:', config);
    
    // Encrypt sensitive data
    const encrypted = envManager.encrypt('sensitive-value');
    console.log('Encrypted:', encrypted);
    
    // Decrypt when needed
    const decrypted = envManager.decrypt(encrypted);
    console.log('Decrypted:', decrypted);
  } catch (error) {
    console.error('Configuration error:', error);
  }
}

start();
```

## Testing Locally

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your values
3. Install dependencies: `npm install`
4. Run tests: `npm test`

## Environment Variables

- `NODE_ENV`: Application environment (development/production/test)
- `PORT`: Application port
- `DATABASE_URL`: Database connection string
- `ENV_ENCRYPTION_KEY`: Key for encrypting sensitive values
- `AWS_REGION`: AWS region for Secrets Manager
- `AWS_SECRET_NAME`: Name of the secret in AWS Secrets Manager

## License

ISC
