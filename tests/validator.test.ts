import { validateEnv } from '../src/validator';
import { envSchema } from '../src/config';
import { EnvConfig } from '../src/types';

describe('Validator', () => {
  test('validates environment variables', () => {
    const validEnv: EnvConfig = {
      NODE_ENV: 'development',
      PORT: '3000',
      DATABASE_URL: 'https://db.com'
    };
    expect(() => validateEnv(validEnv, envSchema)).not.toThrow();
  });

  test('throws error for invalid variables', () => {
    const invalidEnv: EnvConfig = {
      NODE_ENV: 'invalid',
      DATABASE_URL: 'invalid-url'
    };
    expect(() => validateEnv(invalidEnv, envSchema)).toThrow();
  });
}); 