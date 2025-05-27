export type UserRole = 'USER' | 'ADMIN';
export interface JWTPayload {
    userId: number;
    email: string;
    role: UserRole;
}
declare module 'express' {
    interface Request {
        user?: JWTPayload;
    }
}
export {};
