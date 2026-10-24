import { NextFunction, Response } from "express";
import { IReqUser } from "./auth";
import { Role } from "../utils/jwt";
import response from "../utils/response";

export const requireRole = (...roles: Role[]) => (req: IReqUser, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) return response.unauthorized(res, "forbidden");
  next();
};
