import { Router } from "express";
import { ProductsController } from "../controllers/products";
import { validateRequest } from "../middlewares/validateRequest";
import { productsQuerySchema } from "../schemas/products/query";
import { idSchema } from "../schemas/globals";
import {
  createProductSchema,
  patchProductSchema,
  putProductSchema,
} from "../schemas/products/body";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { checkRole } from "../middlewares/checkRole";

const router = Router();

router.get(
  "/",
  validateRequest(productsQuerySchema),
  ProductsController.getAll
);

router.get("/:id", validateRequest(idSchema), ProductsController.getById);

router.post(
  "/",
  isAuthenticated,
  checkRole,
  validateRequest(createProductSchema),
  ProductsController.create
);

router.delete(
  "/:id",
  isAuthenticated,
  checkRole,
  validateRequest(idSchema),
  ProductsController.delete
);

router.put(
  "/:id",
  isAuthenticated,
  checkRole,
  validateRequest(putProductSchema),
  ProductsController.replace
);

router.patch(
  "/:id",
  isAuthenticated,
  checkRole,
  validateRequest(patchProductSchema),
  ProductsController.update
);

export default router;
