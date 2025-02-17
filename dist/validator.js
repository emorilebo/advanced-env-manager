"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = void 0;
function validateEnv(envConfig, schema) {
    const { error, value } = schema.validate(envConfig, { allowUnknown: true });
    if (error) {
        throw new Error(`Environment validation error: ${error.message}`);
    }
    return value;
}
exports.validateEnv = validateEnv;
