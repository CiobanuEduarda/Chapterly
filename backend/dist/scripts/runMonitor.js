"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monitorLogs_1 = require("../monitor/monitorLogs");
(async () => {
    await (0, monitorLogs_1.monitorLogs)();
    console.log('Monitor run complete!');
    process.exit(0);
})();
//# sourceMappingURL=runMonitor.js.map