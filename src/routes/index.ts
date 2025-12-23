import { Router } from "express";
import authRoutes from "./auth";
import usersRoutes from "./users";
import productsRoutes from "./products";
import categoriesRouter from "./categories";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import webhooksRouter from "./webhooks";

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/products', productsRoutes)
router.use('/categories', categoriesRouter)
router.use('/cart', cartRouter)
router.use('/orders', ordersRouter)
router.use('/webhooks', webhooksRouter)

export default router