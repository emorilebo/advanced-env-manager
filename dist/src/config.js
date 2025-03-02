"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').required(),
    PORT: joi_1.default.number().default(3000),
    DATABASE_URL: joi_1.default.string().uri().required(),
}).unknown();
