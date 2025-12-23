import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "../utils/prismaClient";
import { Decimal } from "@prisma/client/runtime/library";

export class PaymentModel {
  static async createPayment(
    orderId: string,
    amount: Decimal,
    paymentProvider: string
  ) {
    return await prisma.payment.create({
      data: {
        amount,
        paymentProvider,
        orderId,
      },
    });
  }

  static async updateOrderStatusAndPayment(
    orderId: string,
    orderStatus: OrderStatus,
    paymentStatus: PaymentStatus,
    providerTransactionId: string
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: orderStatus },
      });

      await tx.payment.update({
        where: { orderId: orderId },
        data: {
          status: paymentStatus,
          providerTransactionId: providerTransactionId,
        },
      });
    });
  }
}
