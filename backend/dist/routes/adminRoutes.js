// @ts-nocheck
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const roleAuth_1 = require("../middleware/roleAuth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get all monitored users (admin only)
router.get('/monitored-users', auth_1.authenticateToken, roleAuth_1.requireAdmin, async (req, res) => {
    try {
        const monitored = await prisma.monitoredUser.findMany({
            include: {
                user: {
                    select: { id: true, email: true, name: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(monitored);
    }
    catch (error) {
        console.error('Error fetching monitored users:', error);
        res.status(500).json({ error: 'Failed to fetch monitored users' });
    }
});
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map