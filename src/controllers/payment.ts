import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { PaymentServices } from "../services/payment";
import { ENV } from "../config/env";

export class PaymentController {
  static async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: orderId } = req.validatedData!.params as { id: string };
      const userId = req.session!.user!.id as string;

      const result = await PaymentServices.createCheckoutSession(
        userId,
        orderId
      );

      return res.status(200).json({ status: "success", data: result });
    } catch (error) {
      return next(error);
    }
  }

  static async handleWebhook(req: Request, res: Response) {
    try {
      const { body, headers } = req;

      // A. OBTENER DATOS DE LA PETICIÓN
      const paymentId = body?.data?.id;
      const topic = body?.type;

      if (topic !== "payment" || !paymentId) {
        return res.status(200).send();
      }

      // B. VALIDACIÓN DE SEGURIDAD (FIRMA)
      const xSignature = headers["x-signature"] as string;
      const xRequestId = headers["x-request-id"] as string;

      if (!xSignature || !xRequestId || !ENV.MP_WEBHOOK_SECRET) {
        console.warn("Webhook recibido sin firma o sin secreto configurado");
        return res.status(200).send();
      }

      // C. PARSEO DE LA FIRMA
      const parts = xSignature.split(",");
      let ts = "";
      let hash = "";

      parts.forEach((part) => {
        const [key, value] = part.split("=");
        if (key === "ts" && value) ts = value;
        if (key === "v1" && value) hash = value;
      });

      // D. RECREAR EL HASH (HMAC SHA256)
      const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;

      const signature = crypto
        .createHmac("sha256", ENV.MP_WEBHOOK_SECRET)
        .update(manifest)
        .digest("hex");

      // E. COMPARAR HASHES
      if (signature !== hash) {
        console.error("Firma de Webhook inválida. Posible ataque.");
        return res.status(200).send();
      }

      // F. PROCESAR EL PAGO
      PaymentServices.handleWebhook(paymentId)
        .then((result) => {
          console.log(
            `Webhook procesado: Orden ${result.orderId} -> ${result.status}`
          );
        })
        .catch((err) => {
          console.error("Error procesando webhook:", err);
        });

      // G. RESPONDER A MP
      return res.status(200).send();
    } catch (error) {
      console.error("Error crítico en webhook controller:", error);
      return res.status(500).send();
    }
  }
}
