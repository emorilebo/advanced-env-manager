"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAWS = exports.fetchCloudSecrets = exports.validateEnv = exports.loadEnv = exports.EnvManager = exports.initEnvManager = void 0;
const loader_1 = require("./loader");
const validator_1 = require("./validator");
const cloudIntegration_1 = require("./cloudIntegration");
/**
 * Initializes environment manager with a schema and optional cloud secrets
 * @param schema - Joi schema for validation
 * @param useCloudSecrets - Whether to fetch secrets from AWS Secrets Manager
 * @returns Promise resolving to validated environment configuration
 * @deprecated Use EnvManager class directly for better control and features
 */
async function initEnvManager(schema, useCloudSecrets = false) {
    const envConfig = (0, loader_1.loadEnv)();
    if (useCloudSecrets) {
        const cloudSecrets = await (0, cloudIntegration_1.fetchCloudSecrets)();
        Object.assign(envConfig, cloudSecrets);
    }
    if (schema) {
        return (0, validator_1.validateEnv)(envConfig, schema);
    }
    return envConfig;
}
exports.initEnvManager = initEnvManager;
// Export main class and types
var EnvManager_1 = require("./EnvManager");
Object.defineProperty(exports, "EnvManager", { enumerable: true, get: function () { return __importDefault(EnvManager_1).default; } });
// Export utility functions
var loader_2 = require("./loader");
Object.defineProperty(exports, "loadEnv", { enumerable: true, get: function () { return loader_2.loadEnv; } });
var validator_2 = require("./validator");
Object.defineProperty(exports, "validateEnv", { enumerable: true, get: function () { return validator_2.validateEnv; } });
var cloudIntegration_2 = require("./cloudIntegration");
Object.defineProperty(exports, "fetchCloudSecrets", { enumerable: true, get: function () { return cloudIntegration_2.fetchCloudSecrets; } });
Object.defineProperty(exports, "initAWS", { enumerable: true, get: function () { return cloudIntegration_2.initAWS; } });
