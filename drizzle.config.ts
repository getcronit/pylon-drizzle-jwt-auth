import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",

  dbCredentials: {
    url: "postgres://postgres:postgres@localhost:5433/postgres",
  },
});
