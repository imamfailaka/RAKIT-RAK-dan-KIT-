import { NextFunction, Request, Response } from "express";
import { verifyToken, TokenPayload, Role } from "../utils/jwt";
import response from "../utils/response";
import { mongoUserLookup } from "../services/user-lookup";

export interface IReqUser extends Request {
  user?: TokenPayload;
}

export type UserLookup = (id: string) => Promise<{ role: Role; isActive: boolean } | null>;

/**
 * Verifies the token, then trusts the database, not the token, for role and active state,
 * so deactivating or demoting an account takes effect immediately.
 */
export const makeAuthMiddleware = (lookup: UserLookup) =>
  async function authMiddleware(req: IReqUser, res: Response, next: NextFunction) {
    const [scheme, token] = (req.headers?.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) return response.unauthorized(res, "unauthorized");
    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch {
      return response.unauthorized(res, "invalid or expired token");
    }
    let current;
    try {
      current = await lookup(payload.id);
    } catch {
      return response.unauthorized(res, "unauthorized");
    }
    if (!current || !current.isActive) return response.unauthorized(res, "account is not active");
    req.user = { id: payload.id, role: current.role };
    next();
  };

export const authMiddleware = makeAuthMiddleware(mongoUserLookup);
