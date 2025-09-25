import { Router } from "express";
import { AuthController } from "../controllers/auth";

const router = Router();

router.post("/login", () => {
  /* todo llamar al controlador */
});

router.post("/register", AuthController.register);

router.get("/register", (_, res) => {
  res.send("<h1>HI!</h1>")
});

router.post("/logout", () => {
  /*Todo llamar al controlador*/
});

export default router;
