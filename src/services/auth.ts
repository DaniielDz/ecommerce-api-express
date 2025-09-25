import { randomUUID } from "node:crypto";
import { AuthModel } from "../models/auth";
import {
  RegisterParams,
  Result,
  DomainError,
  InfraError,
  PublicUser,
} from "../types";
import bcrypt from "bcrypt";

export class AuthService {
  static async register({
    username,
    password,
  }: RegisterParams): Promise<Result<PublicUser, DomainError | InfraError>> {
    try {
      const existUser = await AuthModel.getUserByUsername(username);
      if (existUser) {
        return { ok: false, error: "USERNAME_TAKEN" };
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = {
        id: randomUUID(),
        username,
        password: passwordHash,
      };

      const created = await AuthModel.register(newUser);
      return { ok: true, data: created };
    } catch {
      return { ok: false, error: "IO_ERROR" };
    }
  }

  static async login({
    username,
    password,
  }: RegisterParams): Promise<Result<PublicUser, DomainError | InfraError>> {
    try {
      const user = await AuthModel.getUserByUsername(username);

      if (!user) {
        return { ok: false, error: "INVALID_CREDENTIALS" };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return { ok: false, error: "INVALID_CREDENTIALS" };
      }

      const { password: pwd, ...publicUser } = user;

      return { ok: true, data: publicUser as PublicUser };
    } catch {
      return { ok: false, error: "IO_ERROR" };
    }
  }
}
