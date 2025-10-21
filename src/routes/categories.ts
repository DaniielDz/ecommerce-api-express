import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createCategorySchema,
  getAllCategoriesSchema,
  patchCategorySchema,
  updateCategorySchema,
} from "../schemas/categories";
import { CategoriesController } from "../controllers/categories";
import { numberIdSchema } from "../schemas/globals";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { checkRole } from "../middlewares/checkRole";

const router = Router();

router.get(
  "/",
  validateRequest(getAllCategoriesSchema),
  CategoriesController.getAll
);

router.get(
  "/:id",
  validateRequest(numberIdSchema),
  CategoriesController.getById
);

router.post(
  "/",
  isAuthenticated,
  checkRole,
  validateRequest(createCategorySchema),
  CategoriesController.create
);

router.delete(
  "/:id",
  isAuthenticated,
  checkRole,
  validateRequest(numberIdSchema),
  CategoriesController.delete
);

router.patch(
  "/:id",
  isAuthenticated,
  checkRole,
  validateRequest(patchCategorySchema),
  CategoriesController.update
);

router.put(
  "/:id",
  isAuthenticated,
  checkRole,
  validateRequest(updateCategorySchema),
  CategoriesController.replace
);

export default router;
