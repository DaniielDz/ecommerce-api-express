// tests/integration/orders.test.ts

import request from "supertest";
import { Request, Response, NextFunction } from "express";
import { Decimal } from "@prisma/client/runtime/library";
import { OrderStatus, Prisma } from "@prisma/client";
import app from "../../src/app";
import { prisma } from "../../src/utils/prismaClient";
import { AppError } from "../../src/errors/AppError";

// --- Mocking Dependencias ---
jest.mock("../../src/utils/prismaClient", () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    orderItem: {
      createMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    cart: {
      findUnique: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)), // Simula transacción exitosa por defecto
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
const userId = "user-test-123";
const orderId = "e7b8c1d2-3f4a-11ec-9bbc-0242ac130002";
const cartId = "cart-for-user-123";
const productId1 = "prod-aaa-789";
const productId2 = "prod-bbb-012";

// Datos de dirección para POST
const mockShippingAddress = {
  street: "Calle Test 123",
  city: "Test City",
  province: "Test Province",
  postalCode: "1234",
  country: "Test Country",
};

// Mock de producto con stock suficiente
const mockProduct1 = {
  id: productId1,
  name: "Producto A",
  price: new Decimal("10.00"),
  stock: 5,
  description: "",
  sku: "",
  categoryId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  imageUrl: null,
};
const mockProduct2 = {
  id: productId2,
  name: "Producto B",
  price: new Decimal("25.50"),
  stock: 10,
  description: "",
  sku: "",
  categoryId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  imageUrl: null,
};

// Mock del carrito devuelto por CartModel.getUserCart
const mockFullCart = {
  id: cartId,
  userId: userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    {
      id: 1,
      quantity: 2,
      createdAt: new Date(),
      product: {
        id: productId1,
        name: "Producto A",
        price: new Decimal("10.00"),
        stock: 5,
        imageUrl: null,
      },
    },
    {
      id: 2,
      quantity: 1,
      createdAt: new Date(),
      product: {
        id: productId2,
        name: "Producto B",
        price: new Decimal("25.50"),
        stock: 10,
        imageUrl: null,
      },
    },
  ],
};
const mockEmptyCart = { ...mockFullCart, items: [] };

// Mock de la orden devuelta por el servicio/modelo
const mockOrder = {
  id: orderId,
  total: new Decimal("45.50"), // Calculado: (10 * 2) + (25.50 * 1)
  status: OrderStatus.PENDING,
  shippingAddressJson: mockShippingAddress as Prisma.JsonValue,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: userId,
  items: [], // GetOrderById incluiría items aquí
  payment: null, // GetOrderById incluiría payment aquí
};

describe("Orders API Integration Tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Inyecta el usuario en la sesión para cada test
    mockIsAuthenticated.mockImplementation(
      (req: Request, _res: Response, next: NextFunction) => {
        (req as any).session = { user: { id: userId } };
        next();
      }
    );
    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback(prisma)
    );
  });

  // --- GET /orders ---
  describe("GET /orders", () => {
    test("debería retornar las órdenes paginadas del usuario (200)", async () => {
      const page = 1;
      const limit = 5;
      const totalOrders = 1;
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.order.count.mockResolvedValue(totalOrders);

      const response = await request(app)
        .get("/orders")
        .query({ page: page.toString(), limit: limit.toString() })
        .expect(200);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId }, skip: 0, take: limit })
      );
      expect(mockPrisma.order.count).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(response.body.status).toBe("success");

      const expectedOrder = {
        ...mockOrder,
        total: mockOrder.total.toString(),
        createdAt: mockOrder.createdAt.toISOString(),
        updatedAt: mockOrder.updatedAt.toISOString(),
      };
      expect(response.body.data).toEqual([expectedOrder]);
      expect(response.body.meta).toEqual({
        ordersQty: totalOrders,
        page: page,
        limit: limit,
        totalPages: 1,
      });
    });

    test("debería retornar error de validación (400) si la paginación es inválida", async () => {
      const response = await request(app)
        .get("/orders")
        .query({ page: "-1", limit: "abc" })
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    test("debería retornar 401 si el usuario no está autenticado", async () => {
      mockIsAuthenticated.mockImplementationOnce(
        (req: Request, res: Response, next: NextFunction) => {
          next(new AppError("No autenticado", 401));
        }
      );

      const response = await request(app)
        .get("/orders")
        .query({ page: "1", limit: "10" })
        .expect(401);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("No autenticado");
    });
  });

  // --- GET /orders/:id ---
  describe("GET /orders/:id", () => {
    test("debería retornar los detalles de una orden específica del usuario (200)", async () => {
      const mockOrderWithDetails = {
        ...mockOrder,
        items: [],
        payment: null,
      };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrderWithDetails);

      const response = await request(app).get(`/orders/${orderId}`).expect(200);

      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: orderId, userId } })
      );
      expect(response.body.status).toBe("success");

      const expectedOrder = {
        ...mockOrderWithDetails,
        total: mockOrder.total.toString(),
        createdAt: mockOrder.createdAt.toISOString(),
        updatedAt: mockOrder.updatedAt.toISOString(),
      };
      expect(response.body.data).toEqual(expectedOrder);
    });

    test("debería retornar 404 si la orden no existe o no pertenece al usuario", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const response = await request(app).get(`/orders/${orderId}`).expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("No se encontró la orden");
    });

    test("debería retornar 400 si el ID de la orden es inválido (no UUID)", async () => {
      const response = await request(app)
        .get("/orders/invalid-uuid-format")
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
    });
  });

  // --- POST /orders ---
  describe("POST /orders", () => {
    test("debería crear una orden desde el carrito, actualizar stock y vaciar carrito (201)", async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(mockFullCart as any);
      mockPrisma.product.findUnique
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);
      // Mocks para las llamadas DENTRO de la transacción simulada
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.orderItem.createMany.mockResolvedValue({
        count: mockFullCart.items.length,
      });
      mockPrisma.product.update
        .mockResolvedValueOnce({
          ...mockProduct1,
          stock: mockProduct1.stock - 2,
        })
        .mockResolvedValueOnce({
          ...mockProduct2,
          stock: mockProduct2.stock - 1,
        });
      // Mock para vaciar carrito (fuera de la tx simulada por $transaction)
      mockPrisma.cartItem.deleteMany.mockResolvedValue({
        count: mockFullCart.items.length,
      });

      const response = await request(app)
        .post("/orders")
        .send(mockShippingAddress)
        .expect(201);

      expect(mockPrisma.cart.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } })
      );
      expect(mockPrisma.product.findUnique).toHaveBeenCalledTimes(
        mockFullCart.items.length
      );

      // Verifica que las llamadas a prisma DENTRO de la transacción ocurrieron
      expect(mockPrisma.order.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.orderItem.createMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.product.update).toHaveBeenCalledTimes(
        mockFullCart.items.length
      );

      // Verifica que el CARRITO se vació DESPUÉS
      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: mockFullCart.id },
      });

      expect(response.body.status).toBe("success");

      const expectedOrder = {
        ...mockOrder,
        total: mockOrder.total.toString(),
        createdAt: mockOrder.createdAt.toISOString(),
        updatedAt: mockOrder.updatedAt.toISOString(),
      };
      expect(response.body.data).toEqual(expectedOrder);
    });

    test("debería retornar 400 si el carrito está vacío", async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(mockEmptyCart as any);

      const response = await request(app)
        .post("/orders")
        .send(mockShippingAddress)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("El carrito está vacio");
    });

    test("debería retornar 409 si un producto no existe durante la creación", async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(mockFullCart as any);
      mockPrisma.product.findUnique
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(null); // Producto 2 no existe

      const response = await request(app)
        .post("/orders")
        .send(mockShippingAddress)
        .expect(409);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("ya no existe");
    });

    test("debería retornar 409 si el stock es insuficiente durante la creación", async () => {
      const lowStockProduct = { ...mockProduct1, stock: 1 }; // Se necesitan 2
      mockPrisma.cart.findUnique.mockResolvedValue(mockFullCart as any);
      mockPrisma.product.findUnique
        .mockResolvedValueOnce(lowStockProduct) // Stock bajo
        .mockResolvedValueOnce(mockProduct2);

      const response = await request(app)
        .post("/orders")
        .send(mockShippingAddress)
        .expect(409);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Stock insuficiente");
    });

    test("debería retornar 400 si la dirección de envío es inválida", async () => {
      const invalidAddress = { ...mockShippingAddress, street: "" }; // Calle vacía

      const response = await request(app)
        .post("/orders")
        .send(invalidAddress)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Error de validación");
      expect(response.body.errors).toBeInstanceOf(Array);
    });
  });
});
