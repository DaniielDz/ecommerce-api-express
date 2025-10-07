import { Request, Response } from "express";
import { AuthService } from "../services/auth";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { UserLogin, UserRegister } from "../types";
export class AuthController {
  static async register(req: Request, res: Response) {
    const { email, password, firstName, lastName }: UserRegister = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "El email, la contraseña, el nombre y el apellido son obligatorios",
      });
    }

    const result = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
    });

    if (!result.ok) {
      if (result.error === "EMAIL_IN_USE") {
        return res
          .status(409)
          .json({ message: `El email ${email} ya está en uso` });
      }

      return res.status(500).json({ message: "Error interno" });
    }

    return res.status(201).json(result.data);
  }

  static async login(req: Request, res: Response) {
    const { email, password }: UserLogin = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "El email y la contraseña son obligatorios",
      });
    }

    const result = await AuthService.login({ email, password });

    if (!result.ok) {
      if (result.error === "INVALID_CREDENTIALS") {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      return res.status(500).json({ message: "Error interno" });
    }

    const token = jwt.sign(
      { id: result.data.id, email: result.data.email },
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
