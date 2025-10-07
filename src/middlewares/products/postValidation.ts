import { Request, Response, NextFunction } from "express";
import { createProductSchema } from "../../schemas/products";

export const postProductValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = createProductSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Error de validación",
      details: result.error.issues,
    });
  }
  
  req.body = result.data;
  return next();
};
