import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { UsersController } from "../controllers/users";
import { validateRequest } from "../middlewares/validateRequest";
import { patchUserSchemaValidation } from "../schemas/users";

const router = Router();

router.get("/me", isAuthenticated, UsersController.getProfile);

router.patch(
  "/me",
  isAuthenticated,
  validateRequest(patchUserSchemaValidation),
  UsersController.updateProfile
);

router.delete("/me", isAuthenticated, UsersController.deleteUser);

export default router;
