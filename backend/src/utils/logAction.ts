import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function logAction({
  userId,
  action,
  entity,
  entityId
}: {
  userId: number;
  action: string;
  entity: string;
  entityId?: number;
}) {
  try {
    await prisma.log.create({
      data: {
        userId,
        action,
        entity,
        entityId
      }
    });
  } catch (err) {
    console.error('Failed to log action:', err);
  }
} 