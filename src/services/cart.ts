import { AppError } from "../errors/AppError";
import { CartModel } from "../models/cart";
import { ProductsModel } from "../models/products";
import { CartItemInput } from "../schemas/cart";

export class CartService {
  static async getUserCart(userId: string) {
    const cart = await CartModel.getUserCart(userId);

    if (!cart) {
      throw new AppError(
        "No se encontró ningún carrito para este usuario",
        404
      );
    }

    return cart;
  }

  static async getCartId(userId: string) {
    const { id } = await this.getUserCart(userId);
    return id;
  }

  static async createOrUpdateCartItem(userId: string, itemData: CartItemInput) {
    const { productId, quantity } = itemData;
    const cartId = await this.getCartId(userId);

    const product = await ProductsModel.getById(productId);

    if (!product) {
      throw new AppError(`Producto con ID ${productId} no encontrado`, 404);
    }

    if (product.stock < quantity) {
      throw new AppError(
        `Stock insuficiente para '${product.name}'. Disponible: ${product.stock}, Solicitado: ${quantity}`,
        409
      );
    }

    const itemExist = await CartModel.findItemByProduct(cartId, productId);

    if (itemExist) {
      const itemUpdated = await CartModel.updateItemQuantity(
        itemExist.id,
        quantity
      );
      return { item: itemUpdated, isCreated: false };
    }

    const itemCreated = await CartModel.createNewItem(cartId, itemData);
    return { item: itemCreated, isCreated: true };
  }

  static async clearCart(userId: string) {
    const cartId = await this.getCartId(userId);
    const { count } = await CartModel.clearCartItems(cartId);
    return count;
  }

  static async updateItemQuantity(itemId: number, quantity: number) {
    const itemExist = await CartModel.findItemById(itemId);
    if (!itemExist) {
      throw new AppError(
        `Item con ID ${itemId} no encontrado en el carrito`,
        404
      );
    }

    const product = await ProductsModel.getById(itemExist.productId);
    if (!product) {
      throw new AppError(
        `Producto asociado al item ${itemId} no encontrado`,
        404
      );
    }
    if (product.stock < quantity) {
      throw new AppError(
        `Stock insuficiente para '${product.name}'. Disponible: ${product.stock}, Solicitado: ${quantity}`,
        409
      );
    }

    return await CartModel.updateItemQuantity(itemId, quantity);
  }

  static async deleteItem(itemId: number) {
    const itemExists = await CartModel.findItemById(itemId);

    if (!itemExists) {
      throw new AppError(
        `No se encontró un item de carrito con id: ${itemId}`,
        404
      );
    }

    return await CartModel.deleteItem(itemId);
  }
}
