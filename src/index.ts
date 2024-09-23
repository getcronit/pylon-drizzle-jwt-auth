import { app, getContext, ServiceError } from "@getcronit/pylon";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as crypto from "crypto";
import { jwt, sign } from "hono/jwt";

import { requireCustomAuth } from "./require-custom-auth";
import * as schema from "./schema";

export const JWT_SECRET = "my-secret";

const DATABASE_URL = process.env.DATABASE_URL as string;

const db = drizzle(postgres(DATABASE_URL), { schema });

class UserController {
  @requireCustomAuth([schema.Role.Admin])
  static async getUsers() {
    return db.query.user.findMany();
  }
  @requireCustomAuth()
  static async me() {
    const ctx = getContext();
    const payload = ctx.get("jwtPayload");
    const user = db.query.user.findFirst({
      where: (users, { eq }) => eq(users.id, payload.sub),
    });

    return user;
  }

  @requireCustomAuth([schema.Role.Admin])
  static async create(data: {
    name: string;
    email: string;
    password: string;
    roles: schema.Role[];
  }) {
    // Overwrite data.password with a hashed version
    data.password = crypto
      .createHash("sha256")
      .update(data.password)
      .digest("hex");

    const user = await db.insert(schema.user).values(data).returning();

    return user;
  }

  static async login(email: string, password: string) {
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const user = await db.query.user.findFirst({
      where: (users, { and, eq }) =>
        and(eq(users.email, email), eq(users.password, hashedPassword)),
    });

    if (!user) {
      throw new ServiceError("Invalid email or password", {
        code: "INVALID_CREDENTIALS",
        statusCode: 401,
        details: { email: email, reason: "Invalid email or password" },
      });
    }

    const payload = {
      sub: user.id,
      roles: user.roles,
      exp: Math.floor(Date.now() / 1000) + 60 * 5, // Token expires in 5 minutes
    };

    const token = sign(payload, JWT_SECRET);

    return {
      token,
      user,
    };
  }
}

export const graphql = {
  Query: {
    users: UserController.getUsers,
    me: UserController.me,
  },
  Mutation: {
    userCreate: UserController.create,
    userLogin: UserController.login,
  },
};

app.get("/me", jwt({ secret: JWT_SECRET }), async (c) => {
  const payload = c.get("jwtPayload");

  const user = await db.query.user.findFirst({
    where: (users, { eq }) => eq(users.id, payload.sub),
  });

  return c.json(user);
});

export default app;
