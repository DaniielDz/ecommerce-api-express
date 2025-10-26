import { CartItemInput } from "../schemas/cart";
import { prisma } from "../utils/prismaClient";

export class CartModel {
  static async getUserCart(userId: string) {
    return await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                stock: true,
              },
            },
          },
        },
      },
    });
  }

  static async findItemById(itemId: number) {
    return await prisma.cartItem.findUnique({
      where: { id: itemId },
    });
  }

  static async findItemByProduct(cartId: string, productId: string) {
    return await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cartId,
          productId: productId,
        },
      },
    });
  }

  static async createCart(userId: string) {
    return await prisma.cart.create({ data: { userId } });
  }

  static async clearCartItems(cartId: string) {
    return await prisma.cartItem.deleteMany({ where: { cartId } });
  }

  static async createNewItem(cartId: string, itemData: CartItemInput) {
    return await prisma.cartItem.create({
      data: {
        cartId,
        ...itemData,
      },
    });
  }

  static async deleteItem(itemId: number) {
    return await prisma.cartItem.delete({ where: { id: itemId } });
  }

  static async updateItemQuantity(itemId: number, newQuantity: number) {
    return await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: newQuantity },
    });
  }
}
