import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { UserLogin, UserRegister } from "../types";
import { AppError } from "../errors/AppError";
export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName }: UserRegister = req.body;

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
      });

      if (!result.ok) {
        if (result.error === "EMAIL_IN_USE") {
          return next(new AppError(`El email ${email} ya está en uso`, 409));
        }

        return next(new AppError("Ocurrió un error durante el registro", 500));
      }

      return res.status(201).json(result.data);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password }: UserLogin = req.body;

      const result = await AuthService.login({ email, password });

      if (!result.ok) {
        if (result.error === "INVALID_CREDENTIALS") {
          return next(new AppError("Credenciales inválidas", 401));
        }

        return next(new AppError("Ocurrio un error al iniciar sesión", 500));
      }

      const token = jwt.sign(
        { id: result.data.id, email: result.data.email },
        ENV.SECRET_JWT_KEY,
        {
          expiresIn: "1h",
        }
      );

      return res
        .cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 3600000,
        })
        .status(200)
        .json({ message: "Login exitoso" });
    } catch (error) {
      return next(error);
    }
  }

  static async logout(_req: Request, res: Response) {
    return res
      .clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json({ message: "Logout exitoso" });
  }
}
