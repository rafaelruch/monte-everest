import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn("[db] DATABASE_URL not configured. Database operations will fail until configured.");
  // Set a dummy connection to prevent crashes
  process.env.DATABASE_URL = "postgres://dummy:dummy@localhost:5432/dummy";
}

// Detectar se é Neon (serverless) ou PostgreSQL tradicional
const isNeonDatabase = process.env.DATABASE_URL.includes('neon.tech') || 
                      process.env.DATABASE_URL.includes('neon.database');

let db: any;
let pool: any;

if (isNeonDatabase) {
  // Configuração para Neon Database (desenvolvimento)
  console.log('[db] Using Neon serverless database');
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  // Configuração para PostgreSQL tradicional (produção EasyPanel)
  console.log('[db] Using traditional PostgreSQL database');
  pool = new PgPool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: false // Disable SSL for traditional PostgreSQL
  });
  db = drizzlePg(pool, { schema });
}

export { pool, db };