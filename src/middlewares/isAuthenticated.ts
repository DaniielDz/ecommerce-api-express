import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies["access_token"];

  if (!token) {
    return res.status(401).json("Usuario no autenticado.");
  }

  try {
    jwt.verify(token, process.env.SECRET_JWT_KEY);
    return next();
  } catch {
    return res.status(400).json("Token Invalido");
  }
};
