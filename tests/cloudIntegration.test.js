const { fetchCloudSecrets } = require("../src/cloudIntegration");

jest.mock("aws-sdk", () => {
  return {
    SecretsManager: jest.fn(() => ({
      getSecretValue: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ SecretString: '{"API_KEY":"abc123"}' }),
      }),
    })),
  };
});

test("fetches cloud secrets", async () => {
  const secrets = await fetchCloudSecrets();
  expect(secrets.API_KEY).toBe("abc123");
});
