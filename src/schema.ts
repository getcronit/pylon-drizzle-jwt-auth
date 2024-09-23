import { serial, text, timestamp, pgTable } from "drizzle-orm/pg-core";

export enum Role {
  Admin = "admin",
  Customer = "customer",
}

export const user = pgTable("user", {
  id: serial("id"),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  roles: text("roles").array().$type<Role[]>().default([]).notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
