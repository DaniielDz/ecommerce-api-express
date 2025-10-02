import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { ProductsFilters } from "../../schemas/products";

export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      req.productFilters = parsed as ProductsFilters;
      next();
    } catch (error) {
      res
        .status(400)
        .json({ error: error instanceof Error ? error.message : error });
    }
  };
}
