import { AppError } from "../errors/AppError";
import { CartModel } from "../models/cart";
import { ProductsModel } from "../models/products";
import { CartItemInput } from "../schemas/cart";

export class CartService {
  static async getUserCart(userId: string) {
    return await CartModel.getUserCart(userId);
  }

  static async getCartId(userId: string) {
    const cart = await this.getUserCart(userId);

    if (!cart) {
      throw new AppError(
        "No se encontró ningún carrito para este usuario",
        404
      );
    }

    return cart.id;
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
      return itemUpdated;
    }

    return await CartModel.createNewItem(cartId, itemData);
  }

  static async clearCart(userId: string) {
    const cartId = await this.getCartId(userId);
    const { count } = await CartModel.clearCartItems(cartId);
    return count;
  }

  static async deleteItem(itemId: number) {
    const itemExists = CartModel.findItemById(itemId);

    if (!itemExists) {
      throw new AppError(
        `No se encontró un item de carrito con id: ${itemId}`,
        404
      );
    }

    return await CartModel.deleteItem(itemId);
  }
}
