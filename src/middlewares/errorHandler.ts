import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { ZodError } from "zod";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Error de validación en los datos de entrada.",
      errors: err.issues.map((e) => ({
        path: e.path,
        message: e.message,
      })),
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Ocurrió un error inesperado en el servidor.",
  });
};
