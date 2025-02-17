"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAWS = exports.fetchCloudSecrets = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const initAWS = () => {
    aws_sdk_1.default.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
    return new aws_sdk_1.default.SecretsManager();
};
exports.initAWS = initAWS;
async function fetchCloudSecrets() {
    try {
        const secretsManager = initAWS();
        const data = await secretsManager
            .getSecretValue({
            SecretId: process.env.AWS_SECRET_NAME || 'default',
        })
            .promise();
        if (!data.SecretString) {
            throw new Error('No secret string found');
        }
        return JSON.parse(data.SecretString);
    }
    catch (err) {
        if (process.env.NODE_ENV === 'test') {
            throw err;
        }
        console.error('Error fetching secrets:', err instanceof Error ? err.message : 'Unknown error');
        return {};
    }
}
exports.fetchCloudSecrets = fetchCloudSecrets;
