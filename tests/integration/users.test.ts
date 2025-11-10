import request from "supertest";
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import app from "../../src/app";
import { prisma } from "../../src/utils/prismaClient";
import { AppError } from "../../src/errors/AppError";

// --- Mocking Dependencias ---
jest.mock("../../src/utils/prismaClient", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("../../src/middlewares/isAuthenticated", () => ({
  isAuthenticated: jest.fn((req: Request, res: Response, next: NextFunction) =>
    next()
  ),
}));

const mockPrisma = jest.mocked(prisma);
const mockIsAuthenticated = jest.mocked(
  require("../../src/middlewares/isAuthenticated").isAuthenticated
);

// --- Datos de Prueba ---
const userId = "user-uuid-123";
const mockUser = {
  id: userId,
  firstName: "Juan",
  lastName: "Perez",
  email: "juan@test.com",
  passwordHash: "hash_secreto_123",
  role: Role.CUSTOMER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// DTO (sin hash)
const mockUserDto = {
  id: userId,
  firstName: "Juan",
  lastName: "Perez",
  email: "juan@test.com",
  role: Role.CUSTOMER,
  createdAt: mockUser.createdAt.toISOString(),
  updatedAt: mockUser.updatedAt.toISOString(),
};

describe("Users API Integration Tests (/users/me)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Inyecta el usuario en la sesión para cada test
    mockIsAuthenticated.mockImplementation(
      (req: Request, _res: Response, next: NextFunction) => {
        (req as any).session = { user: { id: userId } };
        next();
      }
    );
  });

  describe("GET /users/me", () => {
    test("debería retornar el perfil del usuario autenticado (200)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app).get("/users/me").expect(200);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(response.body.status).toBe("success");
      expect(response.body.data).toEqual(mockUserDto);
    });

    test("debería retornar 404 si el usuario de la sesión no existe en BD", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/users/me").expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Usuario no encontrado");
    });

    test("debería retornar 401 si no está autenticado", async () => {
      mockIsAuthenticated.mockImplementationOnce(
        (req: Request, res: Response, next: NextFunction) => {
          next(new AppError("No autenticado", 401));
        }
      );
      const response = await request(app).get("/users/me").expect(401);
      expect(response.body.message).toBe("No autenticado");
    });
  });

  describe("PATCH /users/me", () => {
    const updateData = { firstName: "Pedro" };
    const updatedUser = { ...mockUser, ...updateData };
    const updatedUserDto = { ...mockUserDto, ...updateData };

    test("debería actualizar el perfil del usuario (200)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch("/users/me")
        .send(updateData)
        .expect(200);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
      expect(response.body.status).toBe("success");
      expect(response.body.data).toEqual(updatedUserDto);
    });

    test("debería actualizar el email si está disponible (200)", async () => {
      const updateEmailData = { email: "nuevo@test.com" };
      const updatedUser = { ...mockUser, ...updateEmailData };
      const updatedUserDto = { ...mockUserDto, ...updateEmailData };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch("/users/me")
        .send(updateEmailData)
        .expect(200);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "nuevo@test.com" },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateEmailData,
      });
      expect(response.body.data).toEqual(updatedUserDto);
    });

    test("debería retornar 400 si los datos de validación son incorrectos", async () => {
      const invalidData = { email: "esto-no-es-un-email" };
      const response = await request(app)
        .patch("/users/me")
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].path).toEqual(["body", "email"]);
    });

    test("debería retornar 409 si el email ya está en uso por otro usuario", async () => {
      const updateEmailData = { email: "otro@test.com" };
      const otherUser = { ...mockUser, id: "user-456", email: "otro@test.com" };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.user.findUnique.mockResolvedValueOnce(otherUser);

      const response = await request(app)
        .patch("/users/me")
        .send(updateEmailData)
        .expect(409);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "El correo electrónico ya está en uso"
      );
    });

    test("debería retornar 404 si el usuario a actualizar no existe", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .patch("/users/me")
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe("Usuario no encontrado");
    });
  });

  describe("DELETE /users/me", () => {
    test("debería eliminar la cuenta del usuario (204)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      await request(app).delete("/users/me").expect(204);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    test("debería retornar 404 si el usuario a eliminar no existe", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).delete("/users/me").expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Usuario no encontrado");
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });

    test("debería retornar 401 si no está autenticado", async () => {
      mockIsAuthenticated.mockImplementationOnce(
        (req: Request, res: Response, next: NextFunction) => {
          next(new AppError("No autenticado", 401));
        }
      );
      await request(app).delete("/users/me").expect(401);
    });
  });
});
