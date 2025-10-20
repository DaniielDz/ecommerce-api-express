import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { isAuthenticated } from "../../../src/middlewares/isAuthenticated";
import { AppError } from "../../../src/errors/AppError";

jest.mock("jsonwebtoken");
const mockJwt = jest.mocked(jwt);

const mockRequest = (token?: string) => {
  const req = {
    cookies: {
      access_token: token,
    },
  } as unknown as Request;

  return req;
};

const mockResponse = () => ({}) as Response;
const mockNext = jest.fn() as jest.Mock;

describe("Middleware: isAuthenticated", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SECRET_JWT_KEY = "test-secret";
  });

  test("Debe llamar a next() si el token es válido", () => {
    const req = mockRequest("valid-token");
    mockJwt.verify.mockImplementation(() => {});
    isAuthenticated(req, mockResponse(), mockNext);

    expect(mockJwt.verify).toHaveBeenCalledWith(
      "valid-token",
      process.env.SECRET_JWT_KEY
    );
    expect(mockJwt.verify).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  test("Debe llamar a next() con un AppError si no hay token", () => {
    const req = mockRequest();
    isAuthenticated(req, mockResponse(), mockNext);

    expect(mockJwt.verify).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);

    const error = mockNext.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Usuario no autenticado.");
  });

  test("Debe llamar a next() con un AppError si el token es inválido", () => {
    const req = mockRequest("invalid-token");
    mockJwt.verify.mockImplementation(() => {
      throw new Error("Token verification failed");
    });

    isAuthenticated(req, mockResponse(), mockNext);

    expect(mockJwt.verify).toHaveBeenCalledWith(
      "invalid-token",
      process.env.SECRET_JWT_KEY
    );
    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Token Invalido");
  });
});
