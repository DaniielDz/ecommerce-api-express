import { PaymentServices } from "../../../src/services/payment";
import { PaymentModel } from "../../../src/models/payment";
import { OrdersService } from "../../../src/services/orders";
import { AppError } from "../../../src/errors/AppError";
import { preference, payment } from "../../../src/config/mercadopago";
import { Decimal } from "@prisma/client/runtime/library";

// --- Mocks ---
jest.mock("../../../src/models/payment");
jest.mock("../../../src/services/orders");
jest.mock("../../../src/config/mercadopago", () => ({
  preference: { create: jest.fn() },
  payment: { get: jest.fn() },
}));

const mockPaymentModel = jest.mocked(PaymentModel);
const mockOrdersService = jest.mocked(OrdersService);
const mockPreference = jest.mocked(preference);
const mockPayment = jest.mocked(payment);

// --- Datos de Prueba ---
const userId = "user-123";
const orderId = "order-abc";
const paymentId = "mp-payment-999";

const mockOrder = {
  id: orderId,
  total: new Decimal("100.00"),
  status: "PENDING",
  userId: userId,
  // ... otros campos irrelevantes para este test
};

describe("PaymentServices", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("createCheckoutSession", () => {
    test("debería crear una preferencia y retornar la URL de pago", async () => {
      // 1. Mock Order Service
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder as any);
      // 2. Mock MP Preference
      mockPreference.create.mockResolvedValue({
        init_point: "https://mercadopago.com/checkout/123",
      } as any);
      // 3. Mock Payment Model
      mockPaymentModel.createPayment.mockResolvedValue({} as any);

      const result = await PaymentServices.createCheckoutSession(
        userId,
        orderId
      );

      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith(
        userId,
        orderId
      );
      expect(mockPreference.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            external_reference: orderId,
            items: expect.arrayContaining([
              expect.objectContaining({ unit_price: 100 }),
            ]),
          }),
        })
      );
      expect(mockPaymentModel.createPayment).toHaveBeenCalledWith(
        orderId,
        mockOrder.total,
        "mercadopago"
      );
      expect(result).toEqual({
        payment_url: "https://mercadopago.com/checkout/123",
      });
    });

    test("debería lanzar error 400 si la orden no está en estado PENDING", async () => {
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        status: "PAID",
      } as any);

      await expect(
        PaymentServices.createCheckoutSession(userId, orderId)
      ).rejects.toThrow(AppError);

      await expect(
        PaymentServices.createCheckoutSession(userId, orderId)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Orden no válida para pago",
      });

      expect(mockPreference.create).not.toHaveBeenCalled();
    });
  });

  // --- handleWebhook ---
  describe("handleWebhook", () => {
    test("debería procesar un pago APROBADO y actualizar la orden a PAID", async () => {
      // 1. Mock MP Payment Get
      mockPayment.get.mockResolvedValue({
        external_reference: orderId,
        status: "approved",
      } as any);

      const result = await PaymentServices.handleWebhook(paymentId);

      expect(mockPayment.get).toHaveBeenCalledWith({ id: paymentId });
      expect(mockPaymentModel.updateOrderStatusAndPayment).toHaveBeenCalledWith(
        orderId,
        "PAID",
        "COMPLETED",
        paymentId
      );
      expect(result).toEqual({ orderId, status: "PAID" });
    });

    test("debería procesar un pago RECHAZADO y actualizar la orden a CANCELLED", async () => {
      mockPayment.get.mockResolvedValue({
        external_reference: orderId,
        status: "rejected",
      } as any);

      const result = await PaymentServices.handleWebhook(paymentId);

      expect(mockPaymentModel.updateOrderStatusAndPayment).toHaveBeenCalledWith(
        orderId,
        "CANCELLED",
        "FAILED",
        paymentId
      );
      expect(result).toEqual({ orderId, status: "CANCELLED" });
    });

    test("debería lanzar error 400 si el pago no tiene external_reference", async () => {
      mockPayment.get.mockResolvedValue({
        status: "approved",
        external_reference: null, // Falta el ID de la orden
      } as any);

      await expect(PaymentServices.handleWebhook(paymentId)).rejects.toThrow(
        AppError
      );
      expect(
        mockPaymentModel.updateOrderStatusAndPayment
      ).not.toHaveBeenCalled();
    });
  });
});
