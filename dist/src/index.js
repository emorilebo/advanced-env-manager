"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCloudSecrets = exports.EnvManager = exports.initEnvManager = void 0;
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
Object.defineProperty(exports, "EnvManager", { enumerable: true, get: function () { return EnvManager_1.EnvManager; } });
var cloudIntegration_2 = require("./cloudIntegration");
Object.defineProperty(exports, "fetchCloudSecrets", { enumerable: true, get: function () { return cloudIntegration_2.fetchCloudSecrets; } });
