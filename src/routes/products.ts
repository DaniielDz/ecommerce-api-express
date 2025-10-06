import { Router } from "express";
import { productsQuerySchema } from "../schemas/products";
import { validateQuery } from "../middlewares/products/validateQuery";
import { ProductsController } from "../controllers/products";
import { postProductValidation } from "../middlewares/products/postValidation";
import { validateID } from "../middlewares/validateId";

const router = Router();

router.get("/", validateQuery(productsQuerySchema), ProductsController.getAll);
router.get("/:id", validateID, ProductsController.getById);
router.post("/", postProductValidation, ProductsController.create);
router.delete("/:id", validateID, ProductsController.delete);

export default router;
