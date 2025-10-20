import { Request, Response, NextFunction } from "express";
import { PublicUser } from "../types";
import { AppError } from "../errors/AppError";

export const checkRole = (req: Request, _res: Response, next: NextFunction) => {
  const user = req.session?.user as PublicUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return next(
      new AppError("El usuario no tiene permisos de administrador.", 401)
    );
  }

  return next();
};
