import { monitorLogs } from '../monitor/monitorLogs';

(async () => {
  await monitorLogs();
  console.log('Monitor run complete!');
  process.exit(0);
})(); 