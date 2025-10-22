import request from "supertest";
import { Request, Response, NextFunction } from "express";
import app from "../../src/app";
import { prisma } from "../../src/utils/prismaClient";
import { AppError } from "../../src/errors/AppError";

// --- Mocking de Dependencias ---
// Mocke de Prisma Client
jest.mock("../../src/utils/prismaClient", () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mocke de los middlewares de seguridad
jest.mock("../../src/middlewares/isAuthenticated", () => ({
  isAuthenticated: jest.fn((req: Request, res: Response, next: NextFunction) =>
    next()
  ),
}));
jest.mock("../../src/middlewares/checkRole", () => ({
  checkRole: jest.fn((req: Request, res: Response, next: NextFunction) =>
    next()
  ),
}));

const mockPrisma = jest.mocked(prisma);
const mockIsAuthenticated = jest.mocked(
  require("../../src/middlewares/isAuthenticated").isAuthenticated
);
const mockCheckRole = jest.mocked(
  require("../../src/middlewares/checkRole").checkRole
);

// --- Datos de Prueba ---
const mockCategory = {
  id: 1,
  name: "Electrónica",
  description: "Dispositivos electrónicos",
};

const newCategoryData = {
  name: "Ropa",
  description: "Toda la vestimenta",
};

describe("Categories API Integration Tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Restablece los mocks de seguridad por defecto
    mockIsAuthenticated.mockImplementation(
      (req: Request, res: Response, next: NextFunction) => next()
    );
    mockCheckRole.mockImplementation(
      (req: Request, res: Response, next: NextFunction) => next()
    );
  });

  // --- GET /categories ---
  describe("GET /categories", () => {
    test("debería retornar una lista paginada de categorías (200)", async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);
      mockPrisma.category.count.mockResolvedValue(1);

      const response = await request(app)
        .get("/categories")
        .query({ page: "1", limit: "10" })
        .expect(200);

      expect(response.body).toEqual({
        status: "success",
        result: {
          categories: [mockCategory],
          meta: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        },
      });
    });

    test("debería retornar un error de validación (400) si los query params son inválidos", async () => {
      const response = await request(app)
        .get("/categories")
        .query({ page: "-1", limit: "abc" })
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test("debería retornar un error interno (500) si la base de datos falla", async () => {
      mockPrisma.category.findMany.mockRejectedValue(new Error("DB Error")); // Simula fallo de DB
      const response = await request(app)
        .get("/categories")
        .query({ page: "1", limit: "10" })
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("error inesperado");
    });
  });

  // --- GET /categories/:id ---
  describe("GET /categories/:id", () => {
    test("debería retornar una categoría por ID (200)", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      const response = await request(app).get("/categories/1").expect(200);

      expect(response.body).toEqual({
        status: "success",
        category: mockCategory,
      });
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test("debería retornar un error de validación (400) si el ID es inválido", async () => {
      const response = await request(app).get("/categories/abc").expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    test("debería retornar 'no encontrado' (404) si la categoría no existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/categories/99").expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("No se encontró una categoria");
    });
  });

  // --- POST /categories ---
  describe("POST /categories", () => {
    test("debería crear una nueva categoría (201)", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        id: 2,
        ...newCategoryData,
      });

      const response = await request(app)
        .post("/categories")
        .send(newCategoryData)
        .expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.categoryCreated).toEqual({
        id: 2,
        ...newCategoryData,
      });
    });

    test("debería retornar un error de validación (400) si el body es inválido", async () => {
      const response = await request(app)
        .post("/categories")
        .send({ name: "a" })
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].path).toEqual(["body", "name"]);
    });

    test("debería retornar un error de conflicto (409) si el nombre ya existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      const response = await request(app)
        .post("/categories")
        .send({ name: mockCategory.name })
        .expect(409);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Ya existe la categoria");
    });

    test("debería retornar 'No autenticado' (401) si no hay token", async () => {
      // Sobrescribimos el mock SÓLO para este test
      mockIsAuthenticated.mockImplementationOnce(
        (req: Request, res: Response, next: NextFunction) => {
          next(new AppError("No autenticado", 401)); // Lanzamos el AppError real
        }
      );

      const response = await request(app)
        .post("/categories")
        .send(newCategoryData)
        .expect(401);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("No autenticado");
    });

    test("debería retornar 'Sin permisos' (403) si el rol es incorrecto", async () => {
      // Sobrescribimos el mock SÓLO para este test
      mockCheckRole.mockImplementationOnce(
        (req: Request, res: Response, next: NextFunction) => {
          next(new AppError("Sin permisos", 403)); // Lanzamos el AppError real
        }
      );

      const response = await request(app)
        .post("/categories")
        .send(newCategoryData)
        .expect(403);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Sin permisos");
    });
  });

  // --- PATCH /categories/:id ---
  describe("PATCH /categories/:id", () => {
    const patchData = { name: "Nueva Ropa" };
    const updatedCategory = { ...mockCategory, ...patchData };

    test("debería actualizar parcialmente una categoría (200)", async () => {
      mockPrisma.category.findUnique.mockResolvedValueOnce(mockCategory);
      mockPrisma.category.findUnique.mockResolvedValueOnce(null);
      mockPrisma.category.update.mockResolvedValue(updatedCategory);

      const response = await request(app)
        .patch("/categories/1")
        .send(patchData)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.categoryUpdated).toEqual(updatedCategory);
    });

    test("debería retornar 'no encontrado' (404) si la categoría no existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .patch("/categories/99")
        .send(patchData)
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("No se encontró");
    });

    test("debería retornar un error de validación (400) si el ID es inválido", async () => {
      const response = await request(app)
        .patch("/categories/abc")
        .send(patchData)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
    });

    test("debería retornar un error de validación (400) si el body es inválido", async () => {
      const response = await request(app)
        .patch("/categories/1")
        .send({ name: "a" })
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
    });

    test("debería retornar un error de conflicto (409) si el nuevo nombre ya existe en otra categoría", async () => {
      const conflictingCategory = {
        id: 2,
        name: "Nueva Ropa",
        description: "otra",
      };
      mockPrisma.category.findUnique.mockResolvedValueOnce(mockCategory);
      mockPrisma.category.findUnique.mockResolvedValueOnce(conflictingCategory);

      const response = await request(app)
        .patch("/categories/1")
        .send(patchData)
        .expect(409);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Ya existe la categoria");
    });
  });

  // --- PUT /categories/:id ---
  describe("PUT /categories/:id", () => {
    const replaceData = {
      name: "Ropa Reemplazada",
      description: "Desc Reemplazada",
    };
    const replacedCategory = { id: 1, ...replaceData };

    test("debería reemplazar completamente una categoría (200)", async () => {
      mockPrisma.category.findUnique.mockResolvedValueOnce(mockCategory);
      mockPrisma.category.findUnique.mockResolvedValueOnce(null);
      mockPrisma.category.update.mockResolvedValue(replacedCategory);

      const response = await request(app)
        .put("/categories/1")
        .send(replaceData)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.categoryUpdated).toEqual(replacedCategory);
    });

    test("debería retornar 'no encontrado' (404) si la categoría no existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put("/categories/99")
        .send(replaceData)
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("No se encontró");
    });
  });

  // --- DELETE /categories/:id ---
  describe("DELETE /categories/:id", () => {
    test("debería eliminar una categoría (200)", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.category.delete.mockResolvedValue(mockCategory);

      const response = await request(app).delete("/categories/1").expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.categoryDeleted).toEqual(mockCategory);
    });

    test("debería retornar 'no encontrado' (404) si la categoría no existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await request(app).delete("/categories/99").expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("No se encontró");
    });

    test("debería retornar un error de validación (400) si el ID es inválido", async () => {
      const response = await request(app).delete("/categories/abc").expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
    });
  });
});
