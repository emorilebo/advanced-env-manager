"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loader_1 = require("../src/loader");
describe('Loader', () => {
    test('loads environment variables', () => {
        process.env.TEST_VAR = '123';
        const env = (0, loader_1.loadEnv)();
        expect(env.TEST_VAR).toBe('123');
    });
    afterEach(() => {
        delete process.env.TEST_VAR;
    });
});
