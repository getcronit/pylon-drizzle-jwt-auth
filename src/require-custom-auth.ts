import { getContext, ServiceError } from "@getcronit/pylon";
import { jwt } from "hono/jwt";
import { JWT_SECRET } from ".";

export function requireCustomAuth(roles?: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Access the context and apply the hono/jwt middleware
      const ctx = getContext();

      try {
        await jwt({ secret: JWT_SECRET })(ctx, async () => {});
      } catch (e) {
        throw new ServiceError("Unauthenticated", {
          code: "UNAUTHENTICATED",
          statusCode: 401,
          details: { reason: e.message },
        });
      }

      console.log("ctx", ctx.get("jwtPayload"));

      const currentUserRoles = ctx.get("jwtPayload").roles;

      if (roles) {
        // Check if the user has the required roles
        const hasRequiredRole = roles.some((role) =>
          currentUserRoles.includes(role)
        );

        if (!hasRequiredRole) {
          throw new ServiceError("Unauthorized", {
            code: "UNAUTHORIZED",
            statusCode: 403,
            details: { reason: "User does not have the required roles" },
          });
        }
      }

      // Proceed with the original method
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
