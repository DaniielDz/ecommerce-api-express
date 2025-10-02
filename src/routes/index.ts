import { Router } from "express";
import authRoutes from "./auth";
import productsRoutes from "./products";

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productsRoutes)

export default router