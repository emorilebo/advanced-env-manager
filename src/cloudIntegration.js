const AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });

async function fetchCloudSecrets() {
  const secretsManager = new AWS.SecretsManager();
  try {
    const data = await secretsManager.getSecretValue({ SecretId: "MySecret" }).promise();
    return JSON.parse(data.SecretString);
  } catch (err) {
    console.error("Error fetching secrets:", err.message);
    return {};
  }
}

module.exports = { fetchCloudSecrets };
