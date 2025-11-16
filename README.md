# Advanced Environment Manager

A robust, secure environment variable management library for Node.js with validation, encryption, and AWS Secrets Manager integration.

## Features

- ✅ **Environment variable validation** with Joi schemas
- ✅ **AWS Secrets Manager integration** (using AWS SDK v3)
- ✅ **Encryption/Decryption** of sensitive values using AES-256-GCM
- ✅ **TypeScript support** with full type definitions
- ✅ **Multiple environment support** (development, production, test)
- ✅ **Type checking and default values**
- ✅ **Graceful error handling** with detailed error messages

## Installation

```sh
npm install advanced-env-manager
```

## Requirements

- Node.js 18 or higher
- For AWS Secrets Manager: AWS credentials configured

## Usage

### TypeScript / ES Modules

```typescript
import EnvManager from 'advanced-env-manager';
import Joi from 'joi';

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
  useCloud: true, // Set to true to use AWS Secrets Manager
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

### CommonJS

```javascript
const { EnvManager } = require('advanced-env-manager');
const Joi = require('joi');
// ... same as above
```

## API Reference

### `EnvManager`

Main class for managing environment variables.

#### Constructor Options

```typescript
interface EnvManagerOptions {
  encryptionKey?: string; // Encryption key (or set ENV_ENCRYPTION_KEY)
  envPath?: string; // Path to .env file (default: '.env')
  schema?: Schema; // Joi schema for validation
  useCloud?: boolean; // Enable AWS Secrets Manager (default: false)
}
```

#### Methods

- `initialize(): Promise<EnvConfig>` - Loads and validates environment variables
- `encrypt(value: string): string` - Encrypts a sensitive value
- `decrypt(encryptedValue: string): string` - Decrypts an encrypted value

## Examples

See the [examples](./examples) directory for more usage examples:

- [Basic Usage](./examples/basic-usage.ts)
- [Encryption Example](./examples/encryption-example.ts)
- [Cloud Secrets Example](./examples/cloud-secrets-example.ts)

## Environment Variables

### Local Environment Variables

- `NODE_ENV`: Application environment (development/production/test)
- `PORT`: Application port
- `DATABASE_URL`: Database connection string
- `ENV_ENCRYPTION_KEY`: Key for encrypting sensitive values (32+ characters recommended)

### AWS Secrets Manager

- `AWS_REGION`: AWS region for Secrets Manager (default: us-east-1)
- `AWS_SECRET_NAME`: Name of the secret in AWS Secrets Manager (default: 'default')

## Development

### Testing Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Run tests with coverage: `npm run test:coverage`
5. Run linter: `npm run lint`
6. Format code: `npm run format`

### Building

```sh
npm run build
```

## Security Notes

- **Encryption Key**: Use a strong, random encryption key (32+ characters). Store it securely and never commit it to version control.
- **AWS Credentials**: Configure AWS credentials using AWS CLI, IAM roles, or environment variables. Never hardcode credentials.
- **Environment Files**: Add `.env` files to `.gitignore` to prevent committing sensitive data.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contributors

- Rikwu Godwin Onyung
- Ghedinaeval Charles Don-Ibor
- Michael Fredrick Ikaka
- Godfrey Lebo

## License

ISC
