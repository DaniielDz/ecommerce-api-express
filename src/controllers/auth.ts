import { Request, Response } from "express";
import { AuthService } from "../services/auth";

export class AuthController {
  static async register(req: Request, res: Response) {
    const { username, password }: { username: string; password: string } =
      req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "El nombre de usuario y la contraseña son obligatorios",
      });
    }

    const result = await AuthService.register({ username, password });

    if (!result.ok) {
      if (result.error === "USERNAME_TAKEN") {
        return res
          .status(409)
          .json({ message: `El nombre de usuario ${username} ya existe` });
      }

      return res.status(500).json({ message: "Error interno" });
    }

    return res.status(201).json(result.data);
  }
}
