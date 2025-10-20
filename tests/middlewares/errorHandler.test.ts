import { ZodError } from "zod";
import { AppError } from "../../src/errors/AppError";
import { errorHandler } from "../../src/middlewares/errorHandler";
import { Request, Response } from "express";
import { ZodIssueCode } from "zod/v3";

const mockReq = () => ({}) as Request;
const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn() as jest.Mock;

describe("Middleware: errorHandler", () => {
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("Debe manejar un AppError y responder con su statusCode y mensaje", () => {
    const err = new AppError("Recurso no encontrado", 404);
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Recurso no encontrado",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(err);
  });

  test("Debe manejar un ZodError y responder con status 400 y los detalles", () => {
    const err = new ZodError([
      { code: ZodIssueCode.custom, path: ["email"], message: "Inválido" },
    ]);
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: expect.any(String),
      errors: expect.any(Array),
    });
  });

  test("Debe manejar un error genérico y responder con status 500", () => {
    const err = new Error("Error inesperado");
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Ocurrió un error inesperado en el servidor.",
    });
  });
});
