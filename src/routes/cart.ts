import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { validateRequest } from "../middlewares/validateRequest";
import { CartController } from "../controllers/cart";
import { createCartItemSchema, updateCartItemSchema } from "../schemas/cart";
import { numberIdSchema } from "../schemas/globals";

const router = Router();

router.get("/", isAuthenticated, CartController.getUserCart);

router.delete("/", isAuthenticated, CartController.clearCart);

router.post(
  "/items",
  isAuthenticated,
  validateRequest(createCartItemSchema),
  CartController.createOrUpdateCartItem
);

router.patch(
  "/items/:id",
  isAuthenticated,
  validateRequest(updateCartItemSchema),
  CartController.updateItemQuantity
);

router.delete(
  "/items/:id",
  isAuthenticated,
  validateRequest(numberIdSchema),
  CartController.deleteItem
);

export default router;
