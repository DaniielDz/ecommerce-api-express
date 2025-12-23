import { OrderStatus, PaymentStatus } from "@prisma/client";
import { ENV } from "../config/env";
import { payment, preference } from "../config/mercadopago";
import { AppError } from "../errors/AppError";
import { PaymentModel } from "../models/payment";
import { OrdersService } from "./orders";

export class PaymentServices {
  static async createCheckoutSession(userId: string, orderId: string) {
    const order = await OrdersService.getOrderById(userId, orderId);
    if (!order || order.status !== "PENDING") {
      throw new AppError("Orden no válida para pago", 400);
    }

    const result = await preference.create({
      body: {
        items: [
          {
            id: order.id,
            title: `Orden #${order.id}`,
            quantity: 1,
            unit_price: Number(order.total),
            currency_id: "ARS",
          },
        ],
        payer: { email: "test_user_123@testuser.com" },
        back_urls: {
          success: "https://frontend.com/success",
          failure: "https://frontend.com/failure",
          pending: "https://frontend.com/pending",
        },
        auto_return: "approved",
        notification_url: ENV.API_URL,
        external_reference: order.id,
      },
    });

    await PaymentModel.createPayment(order.id, order.total, "mercadopago");

    return { payment_url: result.init_point };
  }

  static async handleWebhook(paymentId: string) {
    const paymentData = await payment.get({ id: paymentId });
    const orderId = paymentData.external_reference;
    const status = paymentData.status;

    if (!orderId) throw new AppError("Referencia no encontrada", 400);

    let orderStatus: OrderStatus = "PENDING";
    let paymentStatus: PaymentStatus = "PENDING";

    if (status === "approved") {
      orderStatus = "PAID";
      paymentStatus = "COMPLETED";
    } else if (status === "cancelled" || status === "rejected") {
      orderStatus = "CANCELLED";
      paymentStatus = "FAILED";
    }

    await PaymentModel.updateOrderStatusAndPayment(
      orderId,
      orderStatus,
      paymentStatus,
      paymentId 
    );

    return { orderId, status: orderStatus };
  }
}
