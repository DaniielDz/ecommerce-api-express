import { CartService } from "../../../src/services/cart";
import { CartModel } from "../../../src/models/cart";
import { ProductsModel } from "../../../src/models/products";
import { AppError } from "../../../src/errors/AppError";
import { Decimal } from "@prisma/client/runtime/library";

jest.mock("../../../src/models/cart");
jest.mock("../../../src/models/products");
jest.mock("../../../src/errors/AppError", () => ({
  AppError: jest.fn((message, statusCode) => {
    const error = new Error(message);
    (error as any).statusCode = statusCode;
    return error;
  }),
}));

const mockCartModel = jest.mocked(CartModel);
const mockProductsModel = jest.mocked(ProductsModel);
const mockAppError = jest.mocked(AppError);

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

const mockItemInput = {
  productId: "ad12ad16-bbd6-4d1e-895d-9cdec9ee6ad2",
  quantity: 2,
};

describe("CartService", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getUserCart", () => {
    test("deberia retornar el carrito del usuario", async () => {
      mockCartModel.getUserCart.mockResolvedValue(mockCart);

      const result = await CartService.getUserCart(userId);

      expect(mockCartModel.getUserCart).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockCart);
    });

    test("debería lanzar un AppError 404 si el carrito no existe", async () => {
      mockCartModel.getUserCart.mockResolvedValue(null);

      await expect(CartService.getUserCart(userId)).rejects.toThrow(
        "No se encontró ningún carrito para este usuario"
      );

      expect(mockCartModel.getUserCart).toHaveBeenCalledWith(userId);
      expect(mockAppError).toHaveBeenCalledWith(
        "No se encontró ningún carrito para este usuario",
        404
      );
    });
  });

  describe("getCartId", () => {
    test("deberia retornar el id del carrito del usuario", async () => {
      mockCartModel.getUserCart.mockResolvedValue(mockCart);

      const result = await CartService.getCartId(userId);

      expect(mockCartModel.getUserCart).toHaveBeenCalledWith(userId);
      expect(result).toBe(cartId);
    });

    test("debería propagar el error si getUserCart falla", async () => {
      mockCartModel.getUserCart.mockResolvedValue(null);

      await expect(CartService.getCartId(userId)).rejects.toThrow(
        "No se encontró ningún carrito para este usuario"
      );

      expect(mockCartModel.getUserCart).toHaveBeenCalledWith(userId);
      expect(mockAppError).toHaveBeenCalledWith(
        "No se encontró ningún carrito para este usuario",
        404
      );
    });
  });

  describe("createOrUpdateCartItem", () => {
    test("deberia crear el item si no existe", async () => {
      mockCartModel.getUserCart.mockResolvedValue(mockCart);
      mockProductsModel.getById.mockResolvedValue(mockProduct);
      mockCartModel.findItemByProduct.mockResolvedValue(null);
      mockCartModel.createNewItem.mockResolvedValue(mockItem);

      const result = await CartService.createOrUpdateCartItem(
        userId,
        mockItemInput
      );

      expect(mockCartModel.getUserCart).toHaveBeenCalledWith(userId);
      expect(mockProductsModel.getById).toHaveBeenCalledWith(productId);
      expect(mockCartModel.findItemByProduct).toHaveBeenCalledWith(
        cartId,
        productId
      );
      expect(mockCartModel.createNewItem).toHaveBeenCalledWith(
        cartId,
        mockItemInput
      );
      expect(result).toEqual({ item: mockItem, isCreated: true });
    });

    test("deberia actualizar la cantidad si existe el item", async () => {
      mockCartModel.getUserCart.mockResolvedValue(mockCart);
      mockProductsModel.getById.mockResolvedValue(mockProduct);
      mockCartModel.findItemByProduct.mockResolvedValue(mockItem);
      mockCartModel.updateItemQuantity.mockResolvedValue(mockItem);

      const result = await CartService.createOrUpdateCartItem(
        userId,
        mockItemInput
      );

      expect(mockCartModel.getUserCart).toHaveBeenCalledWith(userId);
      expect(mockProductsModel.getById).toHaveBeenCalledWith(productId);
      expect(mockCartModel.findItemByProduct).toHaveBeenCalledWith(
        cartId,
        productId
      );
      expect(mockCartModel.updateItemQuantity).toHaveBeenCalledWith(
        mockItem.id,
        mockItemInput.quantity
      );
      expect(result).toEqual({ item: mockItem, isCreated: false });
    });

    test("deberia lanzar un AppError 404 si no existe el producto a agregar", async () => {
      mockCartModel.getUserCart.mockResolvedValue(mockCart);
      mockProductsModel.getById.mockResolvedValue(null);

      await expect(
        CartService.createOrUpdateCartItem(userId, mockItemInput)
      ).rejects.toThrow(`Producto con ID ${productId} no encontrado`);

      expect(mockAppError).toHaveBeenCalledWith(
        `Producto con ID ${productId} no encontrado`,
        404
      );
    });

    test("deberia lanzar un AppError 409 si stock < quantity", async () => {
      const lowStockProduct = { ...mockProduct, stock: 1 };
      mockCartModel.getUserCart.mockResolvedValue(mockCart);
      mockProductsModel.getById.mockResolvedValue(lowStockProduct);

      const errorMsg = `Stock insuficiente para '${lowStockProduct.name}'. Disponible: ${lowStockProduct.stock}, Solicitado: ${mockItemInput.quantity}`;

      await expect(
        CartService.createOrUpdateCartItem(userId, mockItemInput)
      ).rejects.toThrow(errorMsg);

      expect(mockAppError).toHaveBeenCalledWith(errorMsg, 409);
    });
  });

  describe("clearCart", () => {
    test("deberia limpiar todos los items del carrito", async () => {
      mockCartModel.getUserCart.mockResolvedValue(mockCart);
      mockCartModel.clearCartItems.mockResolvedValue({ count: 5 });

      const result = await CartService.clearCart(userId);

      expect(mockCartModel.getUserCart).toHaveBeenCalledWith(userId);
      expect(mockCartModel.clearCartItems).toHaveBeenCalledWith(cartId);
      expect(result).toBe(5);
    });

    test("deberia propagar el error si getUserCart falla", async () => {
      mockCartModel.getUserCart.mockResolvedValue(null);

      await expect(CartService.clearCart(userId)).rejects.toThrow(
        "No se encontró ningún carrito para este usuario"
      );
      expect(mockCartModel.getUserCart).toHaveBeenCalledWith(userId);
      expect(mockCartModel.clearCartItems).not.toHaveBeenCalled();
      expect(mockAppError).toHaveBeenCalledWith(
        "No se encontró ningún carrito para este usuario",
        404
      );
    });
  });

  describe("updateItemQuantity", () => {
    test("deberia actualizar la cantidad del item", async () => {
      mockCartModel.findItemById.mockResolvedValue(mockItem);
      mockProductsModel.getById.mockResolvedValue(mockProduct);

      const result = await CartService.updateItemQuantity(
        mockItem.id,
        mockItemInput.quantity
      );

      expect(mockCartModel.findItemById).toHaveBeenCalledWith(mockItem.id);
      expect(mockProductsModel.getById).toHaveBeenCalledWith(productId);
      expect(result).toEqual(mockItem);
    });

    test("deberia lanzar un AppError 404 si no existe el item", async () => {
      mockCartModel.findItemById.mockResolvedValue(null);

      await expect(
        CartService.updateItemQuantity(mockItem.id, mockItemInput.quantity)
      ).rejects.toThrow(
        `Item con ID ${mockItem.id} no encontrado en el carrito`
      );

      expect(mockAppError).toHaveBeenCalledWith(
        `Item con ID ${mockItem.id} no encontrado en el carrito`,
        404
      );
      expect(mockCartModel.updateItemQuantity).not.toHaveBeenCalled();
    });

    test("deberia lanzar un AppError 404 si no existe el producto a agregar", async () => {
      mockCartModel.findItemById.mockResolvedValue(mockItem);
      mockProductsModel.getById.mockResolvedValue(null);

      await expect(
        CartService.updateItemQuantity(mockItem.id, mockItemInput.quantity)
      ).rejects.toThrow(
        `Producto asociado al item ${mockItem.id} no encontrado`
      );

      expect(mockProductsModel.getById).toHaveBeenCalledWith(
        mockItemInput.productId
      );
      expect(mockAppError).toHaveBeenCalledWith(
        `Producto asociado al item ${mockItem.id} no encontrado`,
        404
      );
      expect(mockCartModel.updateItemQuantity).not.toHaveBeenCalled();
    });

    test("deberia lanzar un AppError 409 si stock < quantity", async () => {
      const lowStockProduct = { ...mockProduct, stock: 1 };
      const errorMsg = `Stock insuficiente para '${lowStockProduct.name}'. Disponible: ${lowStockProduct.stock}, Solicitado: ${mockItemInput.quantity}`;

      mockCartModel.findItemById.mockResolvedValue(mockItem);
      mockProductsModel.getById.mockResolvedValue(lowStockProduct);

      await expect(
        CartService.updateItemQuantity(mockItem.id, mockItemInput.quantity)
      ).rejects.toThrow(errorMsg);

      expect(mockAppError).toHaveBeenCalledWith(errorMsg, 409);
      expect(mockCartModel.updateItemQuantity).not.toHaveBeenCalled();
    });
  });

  describe("deleteItem", () => {
    test("deberia eliminar el item del carrito", async () => {
      mockCartModel.findItemById.mockResolvedValue(mockItem);
      mockCartModel.deleteItem.mockResolvedValue(mockItem);

      const result = await CartService.deleteItem(mockItem.id);

      expect(mockCartModel.findItemById).toHaveBeenCalledWith(mockItem.id);
      expect(mockCartModel.deleteItem).toHaveBeenCalledWith(mockItem.id);
      expect(result).toEqual(mockItem);
    });

    test("deberia lanzar un AppError 404 si no existe el item en el carrito", async () => {
      mockCartModel.findItemById.mockResolvedValue(null);
      const errorMsg = `No se encontró un item de carrito con id: ${mockItem.id}`;

      await expect(CartService.deleteItem(mockItem.id)).rejects.toThrow(
        errorMsg
      );

      expect(mockAppError).toHaveBeenCalledWith(errorMsg, 404);
    });
  });
});
