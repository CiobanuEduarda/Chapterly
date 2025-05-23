"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = require("../db/init");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Initializing database...');
            const success = yield (0, init_1.initializeDatabase)();
            if (success) {
                console.log('Database initialized successfully');
                process.exit(0);
            }
            else {
                console.error('Failed to initialize database');
                process.exit(1);
            }
        }
        catch (error) {
            console.error('Error initializing database:', error);
            process.exit(1);
        }
    });
}
main();
