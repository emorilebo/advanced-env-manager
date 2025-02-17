"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const validator_1 = require("./validator");
const cloudIntegration_1 = require("./cloudIntegration");
class EnvManager {
    constructor(options = {}) {
        this.encryptionKey = options.encryptionKey || process.env.ENV_ENCRYPTION_KEY || '';
        this.envPath = options.envPath || '.env';
        this.schema = options.schema;
        this.useCloud = options.useCloud || false;
    }
    async initialize() {
        // Load local environment variables
        if (fs_1.default.existsSync(this.envPath)) {
            dotenv_1.default.config({ path: this.envPath });
        }
        let envConfig = { ...process.env };
        // Fetch and merge cloud secrets if enabled
        if (this.useCloud) {
            try {
                const cloudSecrets = await (0, cloudIntegration_1.fetchCloudSecrets)();
                envConfig = { ...envConfig, ...cloudSecrets };
            }
            catch (error) {
                console.warn('Failed to fetch cloud secrets:', error instanceof Error ? error.message : 'Unknown error');
            }
        }
        // Validate if schema is provided
        if (this.schema) {
            envConfig = (0, validator_1.validateEnv)(envConfig, this.schema);
        }
        return envConfig;
    }
}
exports.default = EnvManager;
