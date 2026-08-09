// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

// ✅ Configure WebSocket for server-side only
if (typeof globalThis.WebSocket === 'undefined') {
  // Server-side (Node.js): dynamically import ws
  (async () => {
    const { default: WebSocket } = await import('ws');
    neonConfig.webSocketConstructor = WebSocket;
  })();
} else {
  // Client-side: use native WebSocket
  neonConfig.webSocketConstructor = globalThis.WebSocket;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set');
  }

  const adapter = new PrismaNeon({ connectionString });
  
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}