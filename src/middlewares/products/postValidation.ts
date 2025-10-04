import { Request, Response, NextFunction } from "express";
import { productSchema } from "../../schemas/products";

export const postProductValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = productSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Error de validación",
      details: result.error.issues,
    });
  }
  
  req.body = result.data;
  return next();
};
