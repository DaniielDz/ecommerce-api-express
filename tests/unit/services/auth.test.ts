import { AuthModel } from "../../../src/models/auth";
import bcrypt from "bcrypt";
import { AuthService } from "../../../src/services/auth";
import { PublicUser, UserRegister } from "../../../src/types";
import { User } from "@prisma/client";

jest.mock("../../../src/models/auth");
jest.mock("bcrypt");

describe("AuthService", () => {
  const mockAuthModel = jest.mocked(AuthModel);
  const mockBcrypt = jest.mocked(bcrypt);

  const publicUser: PublicUser = {
    id: "UUID",
    email: "john@test.com",
    firstName: "John",
    lastName: "Doe",
    role: "CUSTOMER",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const user: User = { ...publicUser, passwordHash: "hash" };

  const dataForRegister: UserRegister = {
    email: "john@test.com",
    firstName: "John",
    lastName: "Doe",
    password: "123456",
  };

  beforeEach(() => jest.resetAllMocks());

  describe("Register", () => {
    test("Crea un usuario cuando el email no existe", async () => {
      mockAuthModel.getUserByEmail.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue("hash");
      mockAuthModel.register.mockResolvedValue(publicUser);

      const res = await AuthService.register(dataForRegister);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.email).toBe("john@test.com");
      }
    });

    test("Si existe el email retornar el error EMAIL_IN_USE", async () => {
      mockAuthModel.getUserByEmail.mockResolvedValue(user);

      const res = await AuthService.register(dataForRegister);

      expect(res).toEqual({ ok: false, error: "EMAIL_IN_USE" });
    });
  });

  describe("Login", () => {
    test("Credenciales validas", async () => {
      mockAuthModel.getUserByEmail.mockResolvedValue(user);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await AuthService.login({
        email: "john@test.com",
        password: "pwd",
      });

      expect(res.ok).toBe(true);
    });

    test("Credenciales invalidas: Password", async () => {
      mockAuthModel.getUserByEmail.mockResolvedValue(user);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await AuthService.login({
        email: "john@test.com",
        password: "pwdIncorrecto",
      });

      expect(res).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
    });

    test("Credenciales invalidas: Email", async () => {
      mockAuthModel.getUserByEmail.mockResolvedValue(null);

      const res = await AuthService.login({
        email: "john@test.com",
        password: "pwd",
      });

      expect(res).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
    });
  });
});
