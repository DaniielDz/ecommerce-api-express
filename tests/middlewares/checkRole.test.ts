import { Request, Response } from "express";
import { checkRole } from "../../src/middlewares/checkRole";
import { PublicUser } from "../../src/types";
import { AppError } from "../../src/errors/AppError";

const mockRequest = (sessionData?: { user?: PublicUser }) => {
  return {
    session: sessionData,
  } as unknown as Request;
};

const mockResponse = () => ({}) as Response;
const mockNext = jest.fn() as jest.Mock;

describe("Middleware: checkRole", () => {
  beforeEach(() => jest.clearAllMocks());

  const user: PublicUser = {
    id: "uuid",
    email: "user@email.com",
    firstName: "name",
    lastName: "lastname",
    role: "ADMIN",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test("Debe llamar a next sin args si el rol de usuario es ADMIN", () => {
    const req = mockRequest({ user });

    checkRole(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  test("Debe llamar a next() con un AppError si el rol no es ADMIN", () => {
    user.role = "CUSTOMER";
    const req = mockRequest({ user });

    checkRole(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));

    const error = mockNext.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe(
      "El usuario no tiene permisos de administrador."
    );
  });

  test("Debe llamar a next() con un AppError si no hay usuario en la sesión", () => {
    const req = mockRequest({});

    checkRole(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));

    const error = mockNext.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe(
      "El usuario no tiene permisos de administrador."
    );
  });
});
