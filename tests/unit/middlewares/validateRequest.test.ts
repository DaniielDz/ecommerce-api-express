import { Request, Response } from "express";
import z, { ZodError } from "zod";
import { validateRequest } from "../../../src/middlewares/validateRequest";

const testSchema = z.object({
  body: z.object({
    name: z.string().min(3, "El nombre es muy corto"),
  }),
  params: z.object({
    id: z.uuid("ID inválido"),
  }),
  query: z.object({
    page: z.coerce.number().min(1).optional(),
  }),
});

const mockRequest = (data: { body?: any; params?: any; query?: any }) => {
  const req = {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
  };

  return req as Request;
};

const mockResponse = () => ({}) as Response;
const mockNext = jest.fn() as jest.Mock;

describe("Middleware: validateRequest", () => {
  beforeEach(() => jest.clearAllMocks());

  const validationMiddleware = validateRequest(testSchema);

  test("Debe llamar a next() si la validación del request es exitosa", () => {
    const req = mockRequest({
      body: { name: "John" },
      params: { id: "f8bbe5d8-4b45-48da-a0f1-c64484bb8426" },
      query: { page: "2" },
    });

    validationMiddleware(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
    expect(req.body.name).toBe("John");
  });

  test("Debe llamar a next() con ZodError si la validacion falla", () => {
    const req = mockRequest({
      body: { name: "Jo" },
      params: { id: "not-a-uuid" },
      query: { page: 2 },
    });

    validationMiddleware(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
  });
});
