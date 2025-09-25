import { Request, Response, NextFunction } from "express";
import { PublicUser } from "../types";
import { ENV } from "../config/env";
import jwt from "jsonwebtoken";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token: string = req.cookies["access_token"];
  req.session = { user: null };

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, ENV.SECRET_JWT_KEY) as PublicUser;
    req.session.user = decoded;
  } catch {
    req.session.user = null;
  }

  next();
}
