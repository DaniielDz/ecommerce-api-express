import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";

export const validateRequest = (schema: ZodObject<any>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      Object.assign(req, parsed);

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
