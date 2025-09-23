import { Router } from "express";
import authRoutes from "./auth";

export const router = Router()

router.use('/auth', authRoutes)