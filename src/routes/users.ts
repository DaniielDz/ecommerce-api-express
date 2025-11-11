import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { UsersController } from "../controllers/users";
import { validateRequest } from "../middlewares/validateRequest";
import { patchUserSchemaValidation } from "../schemas/users";
import addressesRouter from "./addresses";

const router = Router();

router.get("/me", isAuthenticated, UsersController.getProfile);

router.patch(
  "/me",
  isAuthenticated,
  validateRequest(patchUserSchemaValidation),
  UsersController.updateProfile
);

router.delete("/me", isAuthenticated, UsersController.deleteUser);

router.use("/me/addresses", isAuthenticated, addressesRouter);

export default router;
