declare module '@prisma/client' {
  export * from '@prisma/client/index';
}

declare module 'bcryptjs' {
  export function hash(data: string, saltOrRounds: string | number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
}

declare module '@faker-js/faker' {
  export const faker: Record<string, unknown>;
}

// Add any other missing type declarations here 