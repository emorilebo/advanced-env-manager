import EnvManager from '../src/EnvManager';
import fs from 'fs';
import Joi from 'joi';

jest.mock('fs');
jest.mock('../src/cloudIntegration');

describe('EnvManager', () => {
  let envManager: EnvManager;
  const testSchema = Joi.object({
    TEST_VAR: Joi.string().required()
  });

  beforeEach(() => {
    process.env.TEST_VAR = 'test-value';
    envManager = new EnvManager({
      envPath: '.env.test',
      schema: testSchema
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.TEST_VAR;
  });

  test('should create instance of EnvManager', () => {
    expect(envManager).toBeInstanceOf(EnvManager);
  });

  test('should initialize with local environment variables', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const config = await envManager.initialize();
    expect(config.TEST_VAR).toBe('test-value');
  });

  test('should validate environment variables against schema', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    delete process.env.TEST_VAR;
    await expect(envManager.initialize()).rejects.toThrow();
  });
}); 