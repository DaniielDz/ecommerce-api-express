import { Router } from "express";
import authRoutes from "./auth";
import productsRoutes from "./products";
import categoriesRouter from "./categories";

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productsRoutes)
router.use('/categories', categoriesRouter)

export default router