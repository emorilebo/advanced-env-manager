"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCloudSecrets = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const client = new client_secrets_manager_1.SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1"
});
async function fetchCloudSecrets() {
    try {
        const input = {
            SecretId: process.env.AWS_SECRET_NAME || "default"
        };
        const command = new client_secrets_manager_1.GetSecretValueCommand(input);
        const response = await client.send(command);
        if (!response.SecretString) {
            throw new Error("No secret string found");
        }
        return JSON.parse(response.SecretString);
    }
    catch (err) {
        if (process.env.NODE_ENV === 'test') {
            throw err;
        }
        console.error("Error fetching secrets:", err instanceof Error ? err.message : String(err));
        return {};
    }
}
exports.fetchCloudSecrets = fetchCloudSecrets;
