import { Request, Response, NextFunction } from 'express';

export type UserRole = 'USER' | 'ADMIN';

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    
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
export const requireAdmin = requireRole(['ADMIN']);

// Convenience middleware for user-only routes
export const requireUser = requireRole(['USER', 'ADMIN']); 