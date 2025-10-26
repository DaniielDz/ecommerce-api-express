import { Router } from "express";
import authRoutes from "./auth";
import productsRoutes from "./products";
import categoriesRouter from "./categories";
import cartRouter from "./cart";

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productsRoutes)
router.use('/categories', categoriesRouter)
router.use('/cart', cartRouter)

export default router