"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore, @ts-nocheck
exports.requireUser = exports.requireAdmin = void 0;
exports.requireRole = requireRole;
// @ts-ignore
function requireRole(roles) {
    // @ts-ignore
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}
// Convenience middleware for admin-only routes
exports.requireAdmin = requireRole(['ADMIN']);
// Convenience middleware for user-only routes
exports.requireUser = requireRole(['USER', 'ADMIN']);
//# sourceMappingURL=roleAuth.js.map