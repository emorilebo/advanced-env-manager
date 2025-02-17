"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
function loadEnv(envFilePath = '.env') {
    if (fs_1.default.existsSync(envFilePath)) {
        dotenv_1.default.config({ path: envFilePath });
    }
    return process.env;
}
exports.loadEnv = loadEnv;
