import { AuthModel } from "../models/auth";
import {
  Result,
  DomainError,
  InfraError,
  PublicUser,
  UserRegister,
  UserLogin,
} from "../types";
import bcrypt from "bcrypt";

export class AuthService {
  static async register({
    email,
    password,
    firstName,
    lastName,
  }: UserRegister): Promise<Result<PublicUser, DomainError | InfraError>> {
    try {
      const existUser = await AuthModel.getUserByEmail(email);
      if (existUser) {
        return { ok: false, error: "EMAIL_IN_USE" };
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = {
        email,
        passwordHash,
        firstName,
        lastName,
      };

      const created = await AuthModel.register(newUser);
      return { ok: true, data: created };
    } catch {
      return { ok: false, error: "IO_ERROR" };
    }
  }

  static async login({
    email,
    password,
  }: UserLogin): Promise<Result<PublicUser, DomainError | InfraError>> {
    try {
      const user = await AuthModel.getUserByEmail(email);

      if (!user) {
        return { ok: false, error: "INVALID_CREDENTIALS" };
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        return { ok: false, error: "INVALID_CREDENTIALS" };
      }

      const { passwordHash: pwd, ...publicUser } = user;

      return { ok: true, data: publicUser as PublicUser };
    } catch {
      return { ok: false, error: "IO_ERROR" };
    }
  }
}
