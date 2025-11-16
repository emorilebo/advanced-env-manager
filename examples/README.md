# Examples

This directory contains example usage of the Advanced Environment Manager.

## Basic Usage

```bash
# Make sure you have a .env file with required variables
npm run build
node dist/examples/basic-usage.js
```

## Encryption Example

```bash
# Set ENV_ENCRYPTION_KEY or modify the example
npm run build
node dist/examples/encryption-example.js
```

## Cloud Secrets Example

```bash
# Configure AWS credentials first
export AWS_REGION=us-east-1
export AWS_SECRET_NAME=my-app-secrets
# Or use AWS CLI: aws configure

npm run build
node dist/examples/cloud-secrets-example.js
```

## Prerequisites

- Node.js 18 or higher
- For cloud examples: AWS credentials configured
- For encryption: Set `ENV_ENCRYPTION_KEY` environment variable
