"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvManager = void 0;
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
const cloudIntegration_1 = require("./cloudIntegration");
class EnvManager {
    constructor(options = {}) {
        this.envPath = options.envPath || '.env';
        this.schema = options.schema;
        this.useCloud = options.useCloud || false;
    }
    async initialize() {
        // Load local environment variables
        if (fs.existsSync(this.envPath)) {
            dotenv.config({ path: this.envPath });
        }
        let envConfig = { ...process.env };
        // Fetch and merge cloud secrets if enabled
        if (this.useCloud) {
            try {
                const cloudSecrets = await (0, cloudIntegration_1.fetchCloudSecrets)();
                envConfig = { ...envConfig, ...cloudSecrets };
            }
            catch (error) {
                console.warn('Failed to fetch cloud secrets:', error instanceof Error ? error.message : String(error));
            }
        }
        // Validate if schema is provided
        if (this.schema) {
            const result = this.schema.validate(envConfig, {
                allowUnknown: true,
                stripUnknown: false
            });
            if (result.error) {
                throw new Error(`Environment validation failed: ${result.error.message}`);
            }
            envConfig = result.value;
        }
        return envConfig;
    }
}
exports.EnvManager = EnvManager;
