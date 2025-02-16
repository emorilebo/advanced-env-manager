const { loadEnv } = require("../src/loader");

test("loads environment variables", () => {
  process.env.TEST_VAR = "123";
  const env = loadEnv();
  expect(env.TEST_VAR).toBe("123");
});
