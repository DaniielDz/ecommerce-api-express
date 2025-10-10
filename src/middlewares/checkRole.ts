import { Request, Response, NextFunction } from "express";
import { PublicUser } from "../types";

export const checkRole = (req: Request, res: Response, next: NextFunction) => {
  const user = req.session?.user as PublicUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return res
      .status(401)
      .json("El usuario no tiene permisos de administrador");
  }

  return next();
};
