import { Request, Response, NextFunction } from "express";
import { idSchema } from "../schemas/products";

export const validateID = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { success, data: parsedId } = idSchema.safeParse(id);

  if (!success) {
    return res.status(400).json({ error: "Formato de ID inválido" });
  }

  req.params["id"] = parsedId;
  return next();
};
