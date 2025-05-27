export type UserRole = 'USER' | 'ADMIN';

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
}

// Extend Express Request type
// @ts-ignore
declare module 'express' {
  interface Request {
    user?: JWTPayload;
  }
}

export {}; 