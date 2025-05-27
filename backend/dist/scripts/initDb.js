"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = require("../db/init");
async function main() {
    try {
        console.log('Initializing database...');
        const success = await (0, init_1.initializeDatabase)();
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
}
main();
//# sourceMappingURL=initDb.js.map