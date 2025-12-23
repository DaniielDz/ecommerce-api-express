import request from "supertest";
import crypto from "crypto";
import app from "../../src/app";
import { ENV } from "../../src/config/env";
import { PaymentServices } from "../../src/services/payment";

// --- Mocks ---
// Mockeamos el servicio completo para no llamar a MP real ni a la DB en el test de integración del controlador
// Queremos probar la capa HTTP y de seguridad del Controller, no el Servicio de nuevo.
jest.mock("../../src/services/payment");
jest.mock("../../src/middlewares/isAuthenticated", () => ({
  isAuthenticated: jest.fn((req, res, next) => {
    req.session = { user: { id: "user-123" } };
    next();
  }),
}));

const mockPaymentServices = jest.mocked(PaymentServices);

ENV.MP_WEBHOOK_SECRET = "secret-test-123";

describe("Payment API Integration", () => {
  const orderId = "c2a9b3d1-4f6a-4b8a-9c0d-3b1a2b3c4d5e";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- POST /orders/:id/checkout ---
  describe("POST /orders/:id/checkout", () => {
    test("debería retornar 200 y la URL de pago", async () => {
      mockPaymentServices.createCheckoutSession.mockResolvedValue({
        payment_url: "https://mp.com/checkout",
      });

      const response = await request(app)
        .post(`/orders/${orderId}/checkout`)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.payment_url).toBe("https://mp.com/checkout");
      expect(mockPaymentServices.createCheckoutSession).toHaveBeenCalledWith(
        "user-123",
        orderId
      );
    });
  });

  // --- POST /webhooks/mercadopago ---
  describe("POST /webhooks/mercadopago", () => {
    const paymentId = "123456789";
    const xRequestId = "req-uuid-000";
    const ts = Date.now().toString();

    // Helper para generar firma válida
    const generateValidSignature = (id: string) => {
      const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
      const hash = crypto
        .createHmac("sha256", ENV.MP_WEBHOOK_SECRET!)
        .update(manifest)
        .digest("hex");
      return `ts=${ts},v1=${hash}`;
    };

    test("debería responder 200 y procesar el webhook si la firma es VÁLIDA", async () => {
      const validSignature = generateValidSignature(paymentId);
      mockPaymentServices.handleWebhook.mockResolvedValue({
        orderId: "1",
        status: "PAID",
      } as any);

      await request(app)
        .post("/webhooks/mercadopago")
        .send({ data: { id: paymentId }, type: "payment" })
        .set("x-signature", validSignature)
        .set("x-request-id", xRequestId)
        .expect(200);

      expect(mockPaymentServices.handleWebhook).toHaveBeenCalledWith(paymentId);
    });

    test("debería responder 200 pero NO procesar si la firma es INVÁLIDA", async () => {
      const invalidSignature = `ts=${ts},v1=hash_falso_invalido`;

      await request(app)
        .post("/webhooks/mercadopago")
        .query({ "data.id": paymentId, type: "payment" })
        .set("x-signature", invalidSignature)
        .set("x-request-id", xRequestId)
        .expect(200);

      // El servicio NO debería haber sido llamado porque la firma falló
      expect(mockPaymentServices.handleWebhook).not.toHaveBeenCalled();
    });

    test("debería responder 200 si falta la firma (seguridad)", async () => {
      await request(app)
        .post("/webhooks/mercadopago")
        .query({ "data.id": paymentId, type: "payment" })
        // Sin headers de firma
        .expect(200);

      expect(mockPaymentServices.handleWebhook).not.toHaveBeenCalled();
    });

    test("debería responder 200 si el topic no es payment", async () => {
      // Generamos firma válida para asegurarnos que el filtro sea por topic
      const validSignature = generateValidSignature("999");

      await request(app)
        .post("/webhooks/mercadopago")
        .query({ "data.id": "999", type: "subscription" }) // Topic incorrecto
        .set("x-signature", validSignature)
        .set("x-request-id", xRequestId)
        .expect(200);

      expect(mockPaymentServices.handleWebhook).not.toHaveBeenCalled();
    });
  });
});
