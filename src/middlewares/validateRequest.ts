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

      req.body = parsed["body"];
      req.params = parsed["params"] as typeof req.params;
      req.query = parsed["query"] as typeof req.query;

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
