import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Supabase : URL "Direct connection" (port 5432) pour les migrations.
    // Valeur vide acceptée pour `prisma generate`, qui n'a pas besoin de la base.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});
