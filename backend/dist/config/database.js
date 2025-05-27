"use strict";
// @ts-ignore
var __importDefault = (this && this.
    // @ts-ignore
    __importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'reallyStronPwd123',
    port: parseInt(process.env.DB_PORT || '5432'),
};
// Create a new pool instance
exports.pool = new pg_1.Pool(dbConfig);
// Test the connection
exports.pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
//# sourceMappingURL=database.js.map