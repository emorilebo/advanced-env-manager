import AWS from 'aws-sdk';
import { CloudSecrets } from './types';

const initAWS = (): AWS.SecretsManager => {
  AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
  return new AWS.SecretsManager();
};

export async function fetchCloudSecrets(): Promise<CloudSecrets> {
  try {
    const secretsManager = initAWS();
    const data = await secretsManager
      .getSecretValue({
        SecretId: process.env.AWS_SECRET_NAME || 'default',
      })
      .promise();

    if (!data.SecretString) {
      throw new Error('No secret string found');
    }

    return JSON.parse(data.SecretString);
  } catch (err) {
    if (process.env.NODE_ENV === 'test') {
      throw err;
    }
    console.error('Error fetching secrets:', err instanceof Error ? err.message : 'Unknown error');
    return {};
  }
}

export { initAWS }; 