import { Router } from "express";
import { AddressesController } from "../controllers/addresses";
import { validateRequest } from "../middlewares/validateRequest";
import { createAddressSchema, updateAddressSchema } from "../schemas/addresses";
import { idSchema } from "../schemas/globals";

const router = Router();

router.get("/", AddressesController.getAll);

router.post(
  "/",
  validateRequest(createAddressSchema),
  AddressesController.createAddress
);

router.get("/:id", validateRequest(idSchema), AddressesController.getById);

router.patch(
  "/:id",
  validateRequest(updateAddressSchema),
  AddressesController.updateAddress
);

router.delete(
  "/:id",
  validateRequest(idSchema),
  AddressesController.deleteAddress
);

export default router;
