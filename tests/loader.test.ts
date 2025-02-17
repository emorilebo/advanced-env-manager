import { loadEnv } from '../src/loader';

describe('Loader', () => {
  test('loads environment variables', () => {
    process.env.TEST_VAR = '123';
    const env = loadEnv();
    expect(env.TEST_VAR).toBe('123');
  });

  afterEach(() => {
    delete process.env.TEST_VAR;
  });
}); 