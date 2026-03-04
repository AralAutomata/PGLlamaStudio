import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./frontend/drizzle/schema.ts",
  out: "./frontend/drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:@localhost:5432/postgres",
  },
});