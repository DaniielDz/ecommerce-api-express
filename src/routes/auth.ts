import { Router } from "express";
import { AuthController } from "../controllers/auth";
import { validateRequest } from "../middlewares/validateRequest";
import { loginSchema } from "../schemas/auth/login";
import { registerSchema } from "../schemas/auth/register";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const router = Router();

router.post("/login", validateRequest(loginSchema), AuthController.login);

router.post(
  "/register",
  validateRequest(registerSchema),
  AuthController.register
);

router.post("/logout", isAuthenticated, AuthController.logout);

export default router;
