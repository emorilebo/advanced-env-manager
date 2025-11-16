"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
/**
 * Loads environment variables from a .env file
 * @param envFilePath - Path to the .env file (defaults to '.env')
 * @returns Environment configuration object
 */
function loadEnv(envFilePath = '.env') {
    if (fs_1.default.existsSync(envFilePath)) {
        const result = dotenv_1.default.config({ path: envFilePath });
        if (result.error) {
            console.warn(`Warning: Failed to load .env file from ${envFilePath}: ${result.error.message}`);
        }
    }
    return { ...process.env };
}
exports.loadEnv = loadEnv;
