// Use require to import PrismaClient when the module's named export isn't detected by TypeScript
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');

declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}