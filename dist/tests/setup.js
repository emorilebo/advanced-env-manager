"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mock AWS SDK v3
jest.mock("@aws-sdk/client-secrets-manager", () => ({
    SecretsManagerClient: jest.fn(() => ({
        send: jest.fn()
    })),
    GetSecretValueCommand: jest.fn()
}));
// Set test environment
process.env.NODE_ENV = 'test';
