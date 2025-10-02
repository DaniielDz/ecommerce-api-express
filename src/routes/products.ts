import { Router } from "express";
import { productsQuerySchema } from "../schemas/products";
import { validateQuery } from "../middlewares/products/validateQuery";
import { ProductsController } from "../controllers/products";

const router = Router();

router.get('/', validateQuery(productsQuerySchema), ProductsController.getAll)

export default router;
