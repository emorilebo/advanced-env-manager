const { validateEnv } = require("../src/validator");
const { envSchema } = require("../src/config");

test("validates environment variables", () => {
  const validEnv = { NODE_ENV: "development", PORT: 3000, DATABASE_URL: "https://db.com" };
  expect(() => validateEnv(validEnv, envSchema)).not.toThrow();
});

test("throws error for invalid variables", () => {
  const invalidEnv = { NODE_ENV: "invalid", DATABASE_URL: "invalid-url" };
  expect(() => validateEnv(invalidEnv, envSchema)).toThrow();
});
