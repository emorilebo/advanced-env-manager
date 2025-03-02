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
const EnvManager_1 = require("../src/EnvManager");
const cloudIntegration_1 = require("../src/cloudIntegration");
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
const Joi = __importStar(require("joi"));
// Mock dependencies
jest.mock('fs');
jest.mock('dotenv');
jest.mock('../src/cloudIntegration');
describe('EnvManager', () => {
    let envManager;
    // Create a real Joi schema with mocked validate method
    const mockSchema = Joi.object().keys({
        TEST_VAR: Joi.string().required()
    });
    // Mock the validate method
    mockSchema.validate = jest.fn().mockReturnValue({
        value: { TEST_VAR: 'validated-value' },
        error: null
    });
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.TEST_VAR = 'test-value';
        // Mock fs.existsSync
        fs.existsSync.mockReturnValue(true);
        // Mock dotenv.config
        dotenv.config.mockReturnValue({
            parsed: { TEST_VAR: 'test-value' }
        });
        // Mock fetchCloudSecrets
        cloudIntegration_1.fetchCloudSecrets.mockResolvedValue({
            CLOUD_SECRET: 'secret-value'
        });
        envManager = new EnvManager_1.EnvManager({
            envPath: '.env.test',
            schema: mockSchema,
            useCloud: true
        });
    });
    afterEach(() => {
        delete process.env.TEST_VAR;
    });
    test('should create instance of EnvManager', () => {
        expect(envManager).toBeInstanceOf(EnvManager_1.EnvManager);
    });
    test('should initialize with local environment variables', async () => {
        const config = await envManager.initialize();
        expect(config.TEST_VAR).toBe('validated-value');
        expect(dotenv.config).toHaveBeenCalledWith({ path: '.env.test' });
    });
    test('should fetch and merge cloud secrets when enabled', async () => {
        const config = await envManager.initialize();
        expect(cloudIntegration_1.fetchCloudSecrets).toHaveBeenCalled();
        expect(config.CLOUD_SECRET).toBe('secret-value');
    });
    test('should validate environment variables when schema is provided', async () => {
        const config = await envManager.initialize();
        expect(mockSchema.validate).toHaveBeenCalled();
        expect(config.TEST_VAR).toBe('validated-value');
    });
    test('should throw error when validation fails', async () => {
        mockSchema.validate.mockReturnValueOnce({
            error: new Error('Validation failed'),
            value: null
        });
        await expect(envManager.initialize()).rejects.toThrow('Environment validation failed');
    });
});
