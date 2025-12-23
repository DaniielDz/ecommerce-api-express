import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { validateRequest } from "../middlewares/validateRequest";
import { createOrderSchema, getAllOrdersSchema } from "../schemas/orders";
import { OrdersController } from "../controllers/orders";
import { idSchema } from "../schemas/globals";
import { PaymentController } from "../controllers/payment";

const router = Router();

router.get(
  "/",
  isAuthenticated,
  validateRequest(getAllOrdersSchema),
  OrdersController.getOrders
);

router.post(
  "/",
  isAuthenticated,
  validateRequest(createOrderSchema),
  OrdersController.createOrder
);

router.get(
  "/:id",
  isAuthenticated,
  validateRequest(idSchema),
  OrdersController.getOrderById
);

router.post(
  "/:id/checkout",
  isAuthenticated,
  validateRequest(idSchema),
  PaymentController.createCheckout
);

export default router;
