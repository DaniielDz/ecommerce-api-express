import { AuthModel } from "../../src/models/auth";
import bcrypt from "bcrypt";
import { AuthService } from "../../src/services/auth";

// En vez de usar la implementación real de AuthModel y bcrypt, usar versiones mockeadas.
jest.mock("../../src/models/auth");
jest.mock("bcrypt");

describe("AuthService", () => {
  // jest.mocked le dice a TypeScript:
  // Trata AuthModel y bcrypt como mocks tipados.
  const mockAuthModel = jest.mocked(AuthModel);
  const mockBcrypt = jest.mocked(bcrypt);

  // Antes de cada test resetear todos los mocks
  beforeEach(() => jest.resetAllMocks());

  describe("Register", () => {
    test("Crea un usuario cuando username no existe", async () => {
      mockAuthModel.getUserByUsername.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue("hash");
      mockAuthModel.register.mockResolvedValue({
        id: "UUID",
        username: "usuario1",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await AuthService.register({
        username: "usuario1",
        password: "123456",
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.username).toBe("usuario1");
      }
    });

    test("Si existe el usuario retornar el error USERNAME_TAKEN", async () => {
      mockAuthModel.getUserByUsername.mockResolvedValue({
        id: "UUID",
        username: "usuario1",
        password_hash: "hashedPwd",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await AuthService.register({
        username: "usuario1",
        password: "123456",
      });

      expect(res).toEqual({ ok: false, error: "USERNAME_TAKEN" });
    });
  });

  describe("Login", () => {
    test("Credenciales validas", async () => {
      mockAuthModel.getUserByUsername.mockResolvedValue({
        id: "UUID",
        username: "usuario",
        password_hash: "hashedPwd",
        created_at: new Date(),
        updated_at: new Date(),
      });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await AuthService.login({
        username: "usuario",
        password: "pwd",
      });

      expect(res.ok).toBe(true);
    });

    test("Credenciales invalidas: Password", async () => {
      mockAuthModel.getUserByUsername.mockResolvedValue({
        id: "UUID",
        username: "usuario",
        password_hash: "hashedPwd",
        created_at: new Date(),
        updated_at: new Date(),
      });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await AuthService.login({
        username: "usuario",
        password: "pwdIncorrecto",
      });

      expect(res).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
    });

    test("Credenciales invalidas: Username", async () => {
      mockAuthModel.getUserByUsername.mockResolvedValue(null);

      const res = await AuthService.login({
        username: "usuarioincorrecto",
        password: "pwd",
      });

      expect(res).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
    });
  });
});
