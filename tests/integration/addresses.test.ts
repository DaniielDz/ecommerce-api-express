import request from "supertest";
import { Request, Response, NextFunction } from "express";
import app from "../../src/app";
import { prisma } from "../../src/utils/prismaClient";
import { AppError } from "../../src/errors/AppError";

// --- Mocking Dependencias ---
jest.mock("../../src/utils/prismaClient", () => ({
  prisma: {
    address: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
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
const addressId = "f8bbe5d8-4b45-48da-a0f1-c64484bb8426";
const mockAddress = {
  id: addressId,
  addressLine1: "Calle Falsa 123",
  addressLine2: null,
  city: "Springfield",
  state: "Provincia",
  postalCode: "5000",
  country: "Argentina",
  isDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: userId,
};
const mockDefaultAddress = {
  ...mockAddress,
  id: "c2a9b3d1-4f6a-4b8a-9c0d-3b1a2b3c4d5e",
  isDefault: true,
};
const mockAddressDto = {
  ...mockAddress,
  createdAt: mockAddress.createdAt.toISOString(),
  updatedAt: mockAddress.updatedAt.toISOString(),
};
const addressPayload = {
  addressLine1: "Calle Nueva 456",
  addressLine2: null,
  city: "Ciudad Nueva",
  state: "Estado Nuevo",
  postalCode: "5001",
  country: "Argentina",
  isDefault: false,
};

describe("Addresses API Integration Tests (/users/me/addresses)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Inyecta el usuario en la sesión para cada test
    mockIsAuthenticated.mockImplementation(
      (req: Request, _res: Response, next: NextFunction) => {
        (req as any).session = { user: { id: userId } };
        next();
      }
    );
    // Configura el mock de $transaction para que llame al callback por defecto
    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback(prisma)
    );
  });

  describe("GET /", () => {
    test("debería retornar la lista de direcciones del usuario (200)", async () => {
      mockPrisma.address.findMany.mockResolvedValue([mockAddress]);

      const response = await request(app)
        .get("/users/me/addresses")
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data).toEqual([mockAddressDto]);
      expect(mockPrisma.address.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } })
      );
    });

    test("debería retornar 401 si no está autenticado", async () => {
      mockIsAuthenticated.mockImplementationOnce(
        (req: Request, res: Response, next: NextFunction) => {
          next(new AppError("No autenticado", 401));
        }
      );
      const response = await request(app)
        .get("/users/me/addresses")
        .expect(401);
      expect(response.body.message).toBe("No autenticado");
    });
  });

  describe("POST /", () => {
    test("debería crear una nueva dirección (201)", async () => {
      const newAddress = { ...mockAddress, ...addressPayload, id: "new-uuid" };
      mockPrisma.address.create.mockResolvedValue(newAddress);

      const response = await request(app)
        .post("/users/me/addresses")
        .send(addressPayload)
        .expect(201);

      expect(mockPrisma.address.create).toHaveBeenCalled();
      expect(response.body.status).toBe("success");
      expect(response.body.data.addressLine1).toBe("Calle Nueva 456");
    });

    test("debería manejar 'isDefault' y llamar a $transaction (201)", async () => {
      const defaultPayload = { ...addressPayload, isDefault: true };
      const newDefaultAddress = {
        ...mockAddress,
        ...defaultPayload,
        id: "new-uuid",
      };

      mockPrisma.address.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.address.create.mockResolvedValue(newDefaultAddress);

      const response = await request(app)
        .post("/users/me/addresses")
        .send(defaultPayload)
        .expect(201);

      expect(mockPrisma.$transaction).toHaveBeenCalled(); // Verifica que se usó la transacción
      expect(mockPrisma.address.updateMany).toHaveBeenCalled(); // Verif. que se reseteó el default
      expect(mockPrisma.address.create).toHaveBeenCalled();
      expect(response.body.data.isDefault).toBe(true);
    });

    test("debería retornar 400 si faltan datos (validation)", async () => {
      const invalidPayload = { ...addressPayload, city: "" }; // city no puede ser vacío
      const response = await request(app)
        .post("/users/me/addresses")
        .send(invalidPayload)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
    });
  });

  describe("GET /:id", () => {
    test("debería retornar una dirección específica del usuario (200)", async () => {
      mockPrisma.address.findUnique.mockResolvedValue(mockAddress);

      const response = await request(app)
        .get(`/users/me/addresses/${addressId}`)
        .expect(200);

      expect(mockPrisma.address.findUnique).toHaveBeenCalledWith({
        where: { id: addressId },
      });
      expect(response.body.status).toBe("success");
      expect(response.body.data).toEqual(mockAddressDto);
    });

    test("debería retornar 404 si la dirección no existe", async () => {
      mockPrisma.address.findUnique.mockResolvedValue(null);
      const response = await request(app)
        .get(`/users/me/addresses/${addressId}`)
        .expect(404);
      expect(response.body.message).toBe(
        "No se encontró la dirección solicitada"
      );
    });

    test("debería retornar 404 si la dirección no pertenece al usuario", async () => {
      const otherUserAddress = { ...mockAddress, userId: "other-user-id" };
      mockPrisma.address.findUnique.mockResolvedValue(otherUserAddress);

      const response = await request(app)
        .get(`/users/me/addresses/${addressId}`)
        .expect(404);
      expect(response.body.message).toBe(
        "No se encontró la dirección solicitada"
      );
    });
  });

  describe("PATCH /:id", () => {
    const patchData = { city: "Ciudad Actualizada" };
    const mockAddressForPatch = { ...mockAddress, id: addressId };
    const updatedAddress = { ...mockAddressForPatch, ...patchData };

    test("debería actualizar una dirección (200)", async () => {
      mockPrisma.address.findUnique.mockResolvedValue(mockAddressForPatch); 
      mockPrisma.address.update.mockResolvedValue(updatedAddress); 

      const response = await request(app)
        .patch(`/users/me/addresses/${addressId}`)
        .send(patchData)
        .expect(200);

      expect(mockPrisma.address.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: addressId },
          data: patchData,
        })
      );
      expect(response.body.data.city).toBe("Ciudad Actualizada");
      expect(response.body.status).toBe("success");
    });

    test("debería manejar 'isDefault: true' y llamar a $transaction (200)", async () => {
      const patchDefaultData = { isDefault: true };
      const updatedDefaultAddress = { ...mockAddressForPatch, isDefault: true };

      mockPrisma.address.findUnique.mockResolvedValue(mockAddressForPatch); 
      mockPrisma.address.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.address.update.mockResolvedValue(updatedDefaultAddress);

      const response = await request(app)
        .patch(`/users/me/addresses/${addressId}`)
        .send(patchDefaultData)
        .expect(200);

      expect(mockPrisma.$transaction).toHaveBeenCalled(); 
      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, isDefault: true, id: { not: addressId } },
        })
      );
      expect(response.body.data.isDefault).toBe(true);
    });

    test("debería retornar 400 si el ID es inválido (no UUID)", async () => {
      const response = await request(app)
        .patch("/users/me/addresses/abc")
        .send(patchData)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
    });

    test("debería retornar 400 si el body es inválido (validation)", async () => {
      const invalidData = { city: "" }; 

      const response = await request(app)
        .patch(`/users/me/addresses/${addressId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.errors[0].path).toEqual(["body", "city"]);
    });

    test("debería retornar 401 si no está autenticado", async () => {
      mockIsAuthenticated.mockImplementationOnce(
        (req: Request, res: Response, next: NextFunction) => {
          next(new AppError("No autenticado", 401));
        }
      );

      const response = await request(app)
        .patch(`/users/me/addresses/${addressId}`)
        .send(patchData)
        .expect(401);

      expect(response.body.message).toBe("No autenticado");
    });

    test("debería retornar 404 si la dirección no existe", async () => {
      mockPrisma.address.findUnique.mockResolvedValue(null); 

      const response = await request(app)
        .patch(`/users/me/addresses/${addressId}`)
        .send(patchData)
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "No se encontró la dirección solicitada"
      );
      expect(mockPrisma.address.update).not.toHaveBeenCalled();
    });

    test("debería retornar 404 si la dirección no pertenece al usuario", async () => {
      const otherUserAddress = {
        ...mockAddressForPatch,
        userId: "otro-usuario-id",
      };
      mockPrisma.address.findUnique.mockResolvedValue(otherUserAddress); 

      const response = await request(app)
        .patch(`/users/me/addresses/${addressId}`)
        .send(patchData)
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "No se encontró la dirección solicitada"
      );
      expect(mockPrisma.address.update).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /:id", () => {
    test("debería eliminar una dirección (204)", async () => {
      mockPrisma.address.findUnique.mockResolvedValue(mockAddress);
      mockPrisma.address.delete.mockResolvedValue(mockAddress);

      await request(app).delete(`/users/me/addresses/${addressId}`).expect(204);

      expect(mockPrisma.address.delete).toHaveBeenCalledWith({
        where: { id: addressId },
      });
    });

    test("debería retornar 400 si se intenta eliminar la dirección predeterminada", async () => {
      mockPrisma.address.findUnique.mockResolvedValue(mockDefaultAddress); // Es default

      const response = await request(app)
        .delete(`/users/me/addresses/${mockDefaultAddress.id}`)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "No se puede eliminar la dirección predeterminada"
      );
      expect(mockPrisma.address.delete).not.toHaveBeenCalled();
    });

    test("debería retornar 404 si la dirección a eliminar no existe", async () => {
      mockPrisma.address.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/users/me/addresses/${addressId}`)
        .expect(404);

      expect(response.body.message).toBe(
        "No se encontró la dirección solicitada"
      );
      expect(mockPrisma.address.delete).not.toHaveBeenCalled();
    });
  });
});
