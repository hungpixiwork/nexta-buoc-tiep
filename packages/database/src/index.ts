import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export * from './schema';

export function createDatabaseClient(d1: any) {
  return drizzle(d1, { schema });
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
