"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("../src/validator");
const config_1 = require("../src/config");
describe('Validator', () => {
    test('validates environment variables', () => {
        const validEnv = {
            NODE_ENV: 'development',
            PORT: '3000',
            DATABASE_URL: 'https://db.com'
        };
        expect(() => (0, validator_1.validateEnv)(validEnv, config_1.envSchema)).not.toThrow();
    });
    test('throws error for invalid variables', () => {
        const invalidEnv = {
            NODE_ENV: 'invalid',
            DATABASE_URL: 'invalid-url'
        };
        expect(() => (0, validator_1.validateEnv)(invalidEnv, config_1.envSchema)).toThrow();
    });
});
