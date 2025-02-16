const { loadEnv } = require("./loader");
const { validateEnv } = require("./validator");
const { fetchCloudSecrets } = require("./cloudIntegration");

async function initEnvManager(schema, useCloudSecrets = false) {
  const envConfig = loadEnv();

  if (useCloudSecrets) {
    const cloudSecrets = await fetchCloudSecrets();
    Object.assign(envConfig, cloudSecrets);
  }

  validateEnv(envConfig, schema);

  return envConfig;
}

module.exports = { initEnvManager };
