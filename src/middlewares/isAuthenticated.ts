import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { ENV } from "../config/env";

export const isAuthenticated = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token = req.cookies["access_token"];

  if (!token) {
    return next(new AppError("Usuario no autenticado.", 401));
  }

  try {
    jwt.verify(token, ENV.SECRET_JWT_KEY);
    return next();
  } catch {
    return next(new AppError("Token Invalido", 401));
  }
};
