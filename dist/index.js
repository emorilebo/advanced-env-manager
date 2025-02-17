"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvManager = exports.initEnvManager = void 0;
const loader_1 = require("./loader");
const validator_1 = require("./validator");
const cloudIntegration_1 = require("./cloudIntegration");
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
var EnvManager_1 = require("./EnvManager");
Object.defineProperty(exports, "EnvManager", { enumerable: true, get: function () { return __importDefault(EnvManager_1).default; } });
