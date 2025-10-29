import { OrderData, OrderItemInput, OrderItemData } from "../types/orders";
import { prisma } from "../utils/prismaClient";

export class OrdersModel {
  static async getUserOrders(
    userId: string,
    options: { offset: number; limit: number }
  ) {
    return await prisma.order.findMany({
      where: { userId },
      skip: options.offset,
      take: options.limit,
      orderBy: { createdAt: "desc" },
    });
  }

  static async getOrderById(userId: string, orderId: string) {
    return await prisma.order.findUnique({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        payment: true,
      },
    });
  }

  static async countUserOrders(userId: string) {
    return await prisma.order.count({ where: { userId } });
  }

  static async createOrder(
    userId: string,
    orderData: OrderData,
    inputItems: OrderItemInput[]
  ) {
    return await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total: orderData.total,
          shippingAddressJson: orderData.addressInfo,
        },
      });

      const orderItemsData: OrderItemData[] = inputItems.map((item) => ({
        orderId: newOrder.id,
        ...item,
      }));

      await tx.orderItem.createMany({ data: orderItemsData });

      for (const item of inputItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });
  }
}
