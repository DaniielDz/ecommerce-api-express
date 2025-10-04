import { Router } from "express";
import { productsQuerySchema } from "../schemas/products";
import { validateQuery } from "../middlewares/products/validateQuery";
import { ProductsController } from "../controllers/products";
import { postProductValidation } from "../middlewares/products/postValidation";

const router = Router();

router.get('/', validateQuery(productsQuerySchema), ProductsController.getAll)
router.get('/:id', ProductsController.getById)
router.post('/', postProductValidation, ProductsController.create)

export default router;
