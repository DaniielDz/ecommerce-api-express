// tests/unit/services/orders.test.ts

import { Decimal } from "@prisma/client/runtime/library";
import { OrdersService } from "../../../src/services/orders";
import { OrdersModel } from "../../../src/models/orders";
import { CartModel } from "../../../src/models/cart";
import { ProductsModel } from "../../../src/models/products";
import { AppError } from "../../../src/errors/AppError";
import { OrderStatus, Prisma } from "@prisma/client";

// --- Mocking Dependencias ---
jest.mock("../../../src/models/orders");
jest.mock("../../../src/models/cart");
jest.mock("../../../src/models/products");

const mockOrdersModel = jest.mocked(OrdersModel);
const mockCartModel = jest.mocked(CartModel);
const mockProductsModel = jest.mocked(ProductsModel);

// --- Datos de Prueba ---
const userId = "user-123";
const orderId = "order-abc";
const cartId = "cart-xyz";
const productId1 = "prod-aaa";
const productId2 = "prod-bbb";

// Mock del carrito devuelto por CartModel.getUserCart
const mockCart = {
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
        imageUrl: "a.jpg",
        stock: 5, 
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
        imageUrl: "b.jpg",
        stock: 10, 
      },
    },
  ],
};

// Mock de producto devuelto por ProductsModel.getById
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

// Mock de la orden devuelta por OrdersModel
const mockOrder = {
  id: orderId,
  total: new Decimal("45.50"), 
  status: OrderStatus.PENDING,
  shippingAddressJson: {} as Prisma.JsonValue, 
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: userId,
};

// Mock de la dirección de envío
const mockAddressInput = {
  street: "Calle Test 123",
  city: "Test City",
  province: "Test Province",
  postalCode: "1234",
  country: "Test Country",
};

describe("OrdersService", () => {
  beforeEach(() => {
    jest.resetAllMocks(); 
  });

  describe("getUserOrders", () => {
    test("deberia retornar órdenes paginadas y metadatos", async () => {
      const page = 1;
      const limit = 5;
      const totalOrders = 7;
      mockOrdersModel.getUserOrders.mockResolvedValue([mockOrder]);
      mockOrdersModel.countUserOrders.mockResolvedValue(totalOrders);

      const result = await OrdersService.getUserOrders(userId, page, limit);

      expect(mockOrdersModel.getUserOrders).toHaveBeenCalledWith(userId, {
        offset: 0,
        limit: 5,
      });
      expect(mockOrdersModel.countUserOrders).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        orders: [mockOrder],
        meta: {
          ordersQty: totalOrders,
          page: page,
          limit: limit,
          totalPages: Math.ceil(totalOrders / limit), // 2
        },
      });
      expect(result.meta.totalPages).toBe(2);
    });

    test("deberia manejar el caso sin órdenes", async () => {
      mockOrdersModel.getUserOrders.mockResolvedValue([]);
      mockOrdersModel.countUserOrders.mockResolvedValue(0);

      const result = await OrdersService.getUserOrders(userId, 1, 10);

      expect(result).toEqual({
        orders: [],
        meta: {
          ordersQty: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });
    });
  });

  describe("getOrderById", () => {
    test("deberia retornar una orden si pertenece al usuario", async () => {
      mockOrdersModel.getOrderById.mockResolvedValue(mockOrder as any); 

      const result = await OrdersService.getOrderById(userId, orderId);

      expect(mockOrdersModel.getOrderById).toHaveBeenCalledWith(
        userId,
        orderId
      );
      expect(result).toEqual(mockOrder);
    });

    test("deberia lanzar AppError 404 si la orden no existe o no pertenece al usuario", async () => {
      mockOrdersModel.getOrderById.mockResolvedValue(null);

      await expect(OrdersService.getOrderById(userId, orderId)).rejects.toThrow(
        AppError
      );
      await expect(
        OrdersService.getOrderById(userId, orderId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: `No se encontró la orden con id: ${orderId}`,
      });
    });
  });

  describe("createOrder", () => {
    test("deberia crear una orden, vaciar carrito y retornar la nueva orden", async () => {
      mockCartModel.getUserCart.mockResolvedValue(mockCart as any);
      mockProductsModel.getById
        .mockResolvedValueOnce(mockProduct1) 
        .mockResolvedValueOnce(mockProduct2);
      mockOrdersModel.createOrder.mockResolvedValue(mockOrder);
      mockCartModel.clearCartItems.mockResolvedValue({
        count: mockCart.items.length,
      });

      const result = await OrdersService.createOrder(userId, mockAddressInput);

      expect(mockCartModel.getUserCart).toHaveBeenCalledWith(userId);
      expect(mockProductsModel.getById).toHaveBeenCalledTimes(
        mockCart.items.length
      );
      expect(mockProductsModel.getById).toHaveBeenCalledWith(productId1);
      expect(mockProductsModel.getById).toHaveBeenCalledWith(productId2);
      expect(mockOrdersModel.createOrder).toHaveBeenCalledTimes(1);
      expect(mockOrdersModel.createOrder).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          total: expect.any(Decimal),
          addressInfo: mockAddressInput,
        }),
        expect.arrayContaining([
          expect.objectContaining({
            productId: productId1,
            quantity: 2,
            price: mockProduct1.price,
          }),
          expect.objectContaining({
            productId: productId2,
            quantity: 1,
            price: mockProduct2.price,
          }),
        ])
      );
      const expectedTotal = mockProduct1.price
        .times(2)
        .plus(mockProduct2.price.times(1));
      const actualTotal = (mockOrdersModel.createOrder.mock.calls[0][1] as any)
        .total;
      expect(actualTotal.equals(expectedTotal)).toBe(true);

      expect(mockCartModel.clearCartItems).toHaveBeenCalledWith(cartId);
      expect(result).toEqual(mockOrder);
    });

    test("deberia lanzar AppError 404 si el carrito no existe", async () => {
      mockCartModel.getUserCart.mockResolvedValue(null);

      await expect(
        OrdersService.createOrder(userId, mockAddressInput)
      ).rejects.toThrow(AppError);
      await expect(
        OrdersService.createOrder(userId, mockAddressInput)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "No se encontro el carrito",
      });
      expect(mockOrdersModel.createOrder).not.toHaveBeenCalled();
      expect(mockCartModel.clearCartItems).not.toHaveBeenCalled();
    });

    test("deberia lanzar AppError 400 si el carrito está vacío", async () => {
      mockCartModel.getUserCart.mockResolvedValue({ ...mockCart, items: [] }); 

      await expect(
        OrdersService.createOrder(userId, mockAddressInput)
      ).rejects.toThrow(AppError);
      await expect(
        OrdersService.createOrder(userId, mockAddressInput)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "El carrito está vacio",
      });
      expect(mockOrdersModel.createOrder).not.toHaveBeenCalled();
      expect(mockCartModel.clearCartItems).not.toHaveBeenCalled();
    });

    test("deberia lanzar AppError 409 si un producto ya no existe", async () => {
      mockCartModel.getUserCart.mockResolvedValue(mockCart as any);
      mockProductsModel.getById
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(null); // Producto 2 no existe

      await expect(
        OrdersService.createOrder(userId, mockAddressInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: `Producto con ID ${productId2} ya no existe`,
      });

      expect(mockOrdersModel.createOrder).not.toHaveBeenCalled();
      expect(mockCartModel.clearCartItems).not.toHaveBeenCalled();
    });

    test("deberia lanzar AppError 409 si no hay stock suficiente", async () => {
      const lowStockProduct = { ...mockProduct1, stock: 1 };
      mockCartModel.getUserCart.mockResolvedValue(mockCart as any);
      mockProductsModel.getById
        .mockResolvedValueOnce(lowStockProduct)
        .mockResolvedValueOnce(mockProduct2);

      await expect(
        OrdersService.createOrder(userId, mockAddressInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining(
          `Stock insuficiente para '${lowStockProduct.name}'`
        ),
      });

      expect(mockOrdersModel.createOrder).not.toHaveBeenCalled();
      expect(mockCartModel.clearCartItems).not.toHaveBeenCalled();
    });

    test("deberia lanzar error (y no vaciar carrito) si createOrder falla", async () => {
      mockCartModel.getUserCart.mockResolvedValue(mockCart as any);
      mockProductsModel.getById
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);
      mockOrdersModel.createOrder.mockRejectedValue(
        new Error("Database transaction failed")
      );

      await expect(
        OrdersService.createOrder(userId, mockAddressInput)
      ).rejects.toThrow("Database transaction failed");

      expect(mockOrdersModel.createOrder).toHaveBeenCalledTimes(1);
      expect(mockCartModel.clearCartItems).not.toHaveBeenCalled();
    });

    test("debería retornar la orden aunque clearCartItems falle (y loggear error)", async () => {
      // Mockear console.error para verificar el log
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockCartModel.getUserCart.mockResolvedValue(mockCart as any);
      mockProductsModel.getById
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);
      mockOrdersModel.createOrder.mockResolvedValue(mockOrder);
      mockCartModel.clearCartItems.mockRejectedValue(
        new Error("Failed to clear cart")
      );

      const result = await OrdersService.createOrder(userId, mockAddressInput);

      expect(mockOrdersModel.createOrder).toHaveBeenCalledTimes(1);
      expect(mockCartModel.clearCartItems).toHaveBeenCalledWith(cartId);
      expect(result).toEqual(mockOrder); // La orden se retorna igual
      // Verifica que se loggeó el error
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Error vaciando el carrito: ${cartId}`),
        expect.any(Error)
      );

      consoleSpy.mockRestore(); // Limpia el spy
    });
  });
});
