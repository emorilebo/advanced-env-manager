const AWS = require("aws-sdk");

// Initialize AWS config
const initAWS = () => {
  AWS.config.update({ region: process.env.AWS_REGION || "us-east-1" });
  return new AWS.SecretsManager();
};

async function fetchCloudSecrets() {
  try {
    const secretsManager = initAWS();
    const data = await secretsManager.getSecretValue({
      SecretId: process.env.AWS_SECRET_NAME || "default"
    }).promise();

    if (!data.SecretString) {
      throw new Error("No secret string found");
    }

    return JSON.parse(data.SecretString);
  } catch (err) {
    if (process.env.NODE_ENV === 'test') {
      throw err; // Rethrow in test environment
    }
    console.error("Error fetching secrets:", err.message);
    return {};
  }
}

module.exports = { fetchCloudSecrets, initAWS };
