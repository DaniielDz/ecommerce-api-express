import { Router } from "express";
import { PaymentController } from "../controllers/payment";

const router = Router();

router.post("/mercadopago", PaymentController.handleWebhook);

export default router;
