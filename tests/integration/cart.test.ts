import request from "supertest";
import { Request, Response, NextFunction } from "express";
import app from "../../src/app";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../src/utils/prismaClient";

// --- Mocking de Dependencias ---
jest.mock("../../src/utils/prismaClient", () => ({
  prisma: {
    cart: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    cartItem: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
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
const userId = "76a3639e-a12a-407f-971c-d8d24d76b994";
const cartId = "b0cd0981-c441-4b26-bd8c-03f2aa62de69";
const productId = "ad12ad16-bbd6-4d1e-895d-9cdec9ee6ad2";

const mockProduct = {
  id: productId,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: "Test PC",
  description: "Test description",
  sku: "TESTSKU",
  price: new Decimal(500),
  stock: 10,
  imageUrl: "test.jpg",
  categoryId: 1,
};
const mockCart = {
  id: cartId,
  userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [],
};

const mockItem = {
  id: 1,
  createdAt: new Date(),
  quantity: 2,
  cartId,
  productId,
};

describe("Cart integration api", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockIsAuthenticated.mockImplementation(
      (req: Request, _res: Response, next: NextFunction) => {
        (req as any).session = {
          user: {
            id: userId,
          },
        } as any;
        next();
      }
    );
  });

  // --- GET /cart ---
  describe("GET /cart", () => {
    test("deberia retornar el carrito del usuario", async () => {
      const cartResponse = {
        ...mockCart,
        createdAt: mockCart.createdAt.toISOString(),
        updatedAt: mockCart.updatedAt.toISOString(),
      };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);

      const response = await request(app).get("/cart").expect(200);

      expect(response.body).toEqual({ status: "success", cart: cartResponse });
    });

    test("deberia retornar un 404 si no encuentra el carrito del usuario", async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/cart").expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "No se encontró ningún carrito para este usuario"
      );
    });
  });

  // --- DELETE /cart ---
  describe("DELETE /cart", () => {
    test("deberia vaciar el carrito del usuario", async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 5 });

      await request(app).delete("/cart").expect(204);

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId },
      });
    });

    test("deberia retornar un 404 si no encuentra el carrito (para vaciar)", async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      const response = await request(app).delete("/cart").expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "No se encontró ningún carrito para este usuario"
      );
      expect(mockPrisma.cartItem.deleteMany).not.toHaveBeenCalled();
    });
  });

  // --- POST /cart/items ---
  describe("POST /cart/items", () => {
    test("deberia crear un item nuevo si no existe", async () => {
      const newItem = { productId, quantity: 5 };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null); // No existe
      mockPrisma.cartItem.create.mockResolvedValue(mockItem);

      const response = await request(app)
        .post("/cart/items")
        .send(newItem)
        .expect(201); // 201 Created

      expect(response.body.status).toBe("success");
      expect(response.body.data).toEqual({
        ...mockItem,
        createdAt: mockItem.createdAt.toISOString(),
      });
      expect(mockPrisma.cartItem.create).toHaveBeenCalled();
      expect(mockPrisma.cartItem.update).not.toHaveBeenCalled();
    });

    test("deberia actualizar un item existente si ya está en el carrito", async () => {
      const existingItem = { productId, quantity: 3 };
      const updatedItem = { ...mockItem, quantity: 3 };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.cartItem.findUnique.mockResolvedValue(mockItem); // Sí existe
      mockPrisma.cartItem.update.mockResolvedValue(updatedItem);

      const response = await request(app)
        .post("/cart/items")
        .send(existingItem)
        .expect(200); // 200 OK

      expect(response.body.status).toBe("success");
      expect(response.body.data.quantity).toBe(3);
      expect(mockPrisma.cartItem.update).toHaveBeenCalled();
      expect(mockPrisma.cartItem.create).not.toHaveBeenCalled();
    });

    test("deberia retornar 404 si el producto no existe", async () => {
      const newItem = { productId, quantity: 5 };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.product.findUnique.mockResolvedValue(null); // Producto no existe

      const response = await request(app)
        .post("/cart/items")
        .send(newItem)
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("no encontrado");
    });

    test("deberia retornar 409 si el stock es insuficiente", async () => {
      const newItem = { productId, quantity: 20 }; // Pedimos 20
      const lowStockProduct = { ...mockProduct, stock: 5 }; // Solo hay 5
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.product.findUnique.mockResolvedValue(lowStockProduct);

      const response = await request(app)
        .post("/cart/items")
        .send(newItem)
        .expect(409);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Stock insuficiente");
    });

    test("deberia retornar 400 si faltan datos (validation)", async () => {
      const invalidBody = { productId }; // Falta quantity

      const response = await request(app)
        .post("/cart/items")
        .send(invalidBody)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
    });
  });

  // --- PATCH /cart/items/:id ---
  describe("PATCH /cart/items/:id", () => {
    test("deberia actualizar la cantidad de un item", async () => {
      const updatePayload = { quantity: 8 };
      const updatedItem = { ...mockItem, quantity: 8 };

      mockPrisma.cartItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct); // stock: 10
      mockPrisma.cartItem.update.mockResolvedValue(updatedItem);

      const response = await request(app)
        .patch(`/cart/items/${mockItem.id}`)
        .send(updatePayload)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.quantity).toBe(8);
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: mockItem.id },
        data: { quantity: 8 },
      });
    });

    test("deberia retornar 404 si el item no existe", async () => {
      const updatePayload = { quantity: 8 };
      mockPrisma.cartItem.findUnique.mockResolvedValue(null); // No existe

      const response = await request(app)
        .patch("/cart/items/999")
        .send(updatePayload)
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Item con ID 999 no encontrado");
      expect(mockPrisma.cartItem.update).not.toHaveBeenCalled();
    });

    test("deberia retornar 409 si el stock es insuficiente", async () => {
      const updatePayload = { quantity: 20 }; // Pedimos 20
      const lowStockProduct = { ...mockProduct, stock: 5 }; // Solo hay 5

      mockPrisma.cartItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.product.findUnique.mockResolvedValue(lowStockProduct);

      const response = await request(app)
        .patch(`/cart/items/${mockItem.id}`)
        .send(updatePayload)
        .expect(409);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Stock insuficiente");
      expect(mockPrisma.cartItem.update).not.toHaveBeenCalled();
    });

    test("deberia retornar 400 si la cantidad es inválida (validation)", async () => {
      const invalidPayload = { quantity: 0 }; // Debe ser min 1

      const response = await request(app)
        .patch(`/cart/items/${mockItem.id}`)
        .send(invalidPayload)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
    });

    test("deberia retornar 400 si el ID del item es inválido (validation)", async () => {
      const response = await request(app)
        .patch("/cart/items/abc") // ID no numérico
        .send({ quantity: 5 })
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
    });
  });

  // --- DELETE /cart/items/:id ---
  describe("DELETE /cart/items/:id", () => {
    test("deberia eliminar un item del carrito", async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(mockItem); // Existe
      mockPrisma.cartItem.delete.mockResolvedValue(mockItem);

      await request(app).delete(`/cart/items/${mockItem.id}`).expect(204);

      expect(mockPrisma.cartItem.findUnique).toHaveBeenCalledWith({
        where: { id: mockItem.id },
      });
      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: mockItem.id },
      });
    });

    test("deberia retornar 404 si el item a eliminar no existe", async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null); // No existe

      const response = await request(app).delete("/cart/items/999").expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("No se encontró un item");
      expect(mockPrisma.cartItem.delete).not.toHaveBeenCalled();
    });

    test("deberia retornar 400 si el ID del item es inválido (validation)", async () => {
      const response = await request(app)
        .delete("/cart/items/abc") // ID no numérico
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
    });
  });
});
