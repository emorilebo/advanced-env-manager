const EnvManager = require('../src/EnvManager');

describe('EnvManager', () => {
  let envManager;

  beforeEach(() => {
    envManager = new EnvManager({
      encryptionKey: 'test-key',
      envPath: '.env.test'
    });
  });

  test('should create instance of EnvManager', () => {
    expect(envManager).toBeInstanceOf(EnvManager);
  });
}); 