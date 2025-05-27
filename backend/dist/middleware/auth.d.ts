import { Request, Response, NextFunction } from 'express';
interface JWTPayload {
    userId: number;
    email: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export {};
