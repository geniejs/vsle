import { PrismaClient } from "../../prisma/node_modules/.prisma/client/edge";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const getPrisma = (env: Record<string, string>) => {
  const client =
    globalThis.prisma ??
    new PrismaClient({
      datasources: {
        postgresql: {
          url: env.DATABASE_URL,
        },
      },
    });
  if (process.env.NODE_ENV !== "production") globalThis.prisma = client;
  return client;
};
