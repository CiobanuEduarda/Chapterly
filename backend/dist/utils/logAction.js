// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = logAction;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function logAction({ userId, action, entity, entityId }) {
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
    }
    catch (err) {
        console.error('Failed to log action:', err);
    }
}
//# sourceMappingURL=logAction.js.map