import { Decimal } from "@prisma/client/runtime/library";
import { AppError } from "../errors/AppError";
import { CartModel } from "../models/cart";
import { OrdersModel } from "../models/orders";
import { ProductsModel } from "../models/products";
import { CreateOrderInput } from "../schemas/orders";
import { OrderItemInput } from "../types/orders";

export class OrdersService {
  static async getUserOrders(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const options = { offset, limit };

    const orders = await OrdersModel.getUserOrders(userId, options);
    const ordersQty = await OrdersModel.countUserOrders(userId);

    return {
      orders,
      meta: {
        ordersQty,
        page,
        limit,
        totalPages: Math.ceil(ordersQty / limit),
      },
    };
  }

  static async getOrderById(userId: string, orderId: string) {
    const order = await OrdersModel.getOrderById(userId, orderId);

    if (!order) {
      throw new AppError(`No se encontró la orden con id: ${orderId}`, 404);
    }

    return order;
  }

  static async createOrder(userId: string, orderInput: CreateOrderInput) {
    const cart = await CartModel.getUserCart(userId);

    if (!cart) {
      throw new AppError("No se encontro el carrito", 404);
    }

    if (cart.items.length === 0) {
      throw new AppError("El carrito está vacio", 400);
    }

    const orderItems: OrderItemInput[] = [];
    let calculatedTotal = new Decimal(0);

    for (const item of cart.items) {
      const product = await ProductsModel.getById(item.product.id);

      if (!product) {
        throw new AppError(
          `Producto con ID ${item.product.id} ya no existe`,
          409
        );
      }
      if (product.stock < item.quantity) {
        throw new AppError(
          `Stock insuficiente para '${item.product.name}'. Disponible: ${product.stock}, En carrito: ${item.quantity}`,
          409
        );
      }

      const itemTotal = item.product.price.times(item.quantity);
      calculatedTotal = calculatedTotal.plus(itemTotal);

      orderItems.push({
        productId: product.id,
        price: product.price,
        quantity: item.quantity,
      });
    }

    const orderData = { addressInfo: orderInput, total: calculatedTotal };

    const newOrder = await OrdersModel.createOrder(
      userId,
      orderData,
      orderItems
    );
    await CartModel.clearCartItems(cart.id);

    return newOrder;
  }
}
