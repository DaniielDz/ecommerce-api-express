import { Request, Response, NextFunction } from "express";
import { productPatchSchema } from "../../schemas/products";

export const patchProductValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = productPatchSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Error de validación",
      details: result.error.issues,
    });
  }

  req.body = result.data;
  return next();
};
