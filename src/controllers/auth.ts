import { Request, Response } from "express";
import { AuthService } from "../services/auth";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
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

  static async login(req: Request, res: Response) {
    const { username, password }: { username: string; password: string } =
      req.body;
    if (!username || !password) {
      return res.status(400).json({
        message: "El nombre de usuario y la contraseña son obligatorios",
      });
    }

    const result = await AuthService.login({ username, password });

    if (!result.ok) {
      if (result.error === "INVALID_CREDENTIALS") {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      return res.status(500).json({ message: "Error interno" });
    }

    const token = jwt.sign(
      { id: result.data.id, username: result.data.username },
      ENV.SECRET_JWT_KEY,
      {
        expiresIn: "1h",
      }
    );

    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600000,
      })
      .status(200)
      .json({ message: "Login exitoso" });

    return;
  }

  static async logout(req: Request, res: Response) {
    const token = req.cookies["access_token"];

    if (!token) {
      return res
        .status(401)
        .json({ message: "No hay sesión activa para cerrar" });
    }

    try {
      jwt.verify(token, ENV.SECRET_JWT_KEY);
    } catch {
      return res.status(400).json({
        message: "Token inválido",
      });
    }

    res
      .clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json({ message: "Logout exitoso" });
    return;
  }
}
