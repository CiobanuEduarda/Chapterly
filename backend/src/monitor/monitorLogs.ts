import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const WINDOW_MINUTES = 10; // Time window in minutes
const ACTION_THRESHOLD = 20; // Number of actions in window to be considered suspicious
const MONITOR_INTERVAL = 5 * 60 * 1000; // Run every 5 minutes

export async function monitorLogs() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);

  // Find users with more than ACTION_THRESHOLD actions in the last WINDOW_MINUTES
  const suspicious = await prisma.log.groupBy({
    by: ['userId'],
    where: { timestamp: { gte: windowStart } },
    _count: { id: true },
    having: { id: { _count: { gt: ACTION_THRESHOLD } } }
  });

  for (const user of suspicious) {
    await prisma.monitoredUser.upsert({
      where: { userId: user.userId },
      update: { reason: `High activity: ${user._count.id} actions in ${WINDOW_MINUTES} min` },
      create: { userId: user.userId, reason: `High activity: ${user._count.id} actions in ${WINDOW_MINUTES} min` }
    });
    console.log(`User ${user.userId} flagged as suspicious.`);
  }
}

// Start the monitor interval
export function startMonitor() {
  setInterval(monitorLogs, MONITOR_INTERVAL);
  console.log('Background log monitor started.');
} 