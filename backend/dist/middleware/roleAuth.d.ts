import { Request, Response, NextFunction } from 'express';
export type UserRole = 'USER' | 'ADMIN';
export declare function requireRole(roles: UserRole[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireUser: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
