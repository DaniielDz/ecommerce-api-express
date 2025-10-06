import { Request, Response, NextFunction } from "express";

export const stripUndefinedValues = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] === undefined) {
        delete req.body[key];
      }
    });
  }
  next();
};