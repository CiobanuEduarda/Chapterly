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
    // Check if user exists before logging
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.error('Attempted to log action for non-existent user:', userId);
      return;
    }
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