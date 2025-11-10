import { UsersService } from "../../../src/services/users";
import { UsersModel } from "../../../src/models/users";
import { AppError } from "../../../src/errors/AppError";
import { Role } from "@prisma/client";

jest.mock("../../../src/models/users");

const mockUsersModel = jest.mocked(UsersModel);

// --- Datos de Prueba ---
const userId = "user-uuid-123";
const mockUser = {
  id: userId,
  firstName: "Juan",
  lastName: "Perez",
  email: "juan@test.com",
  passwordHash: "hash_secreto_123",
  role: Role.CUSTOMER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// DTO = Data Transfer Object (lo que devolvemos al cliente, sin el hash)
const mockUserDto = {
  id: userId,
  firstName: "Juan",
  lastName: "Perez",
  email: "juan@test.com",
  role: Role.CUSTOMER,
  createdAt: mockUser.createdAt,
  updatedAt: mockUser.updatedAt,
};

describe("UsersService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("getProfile", () => {
    test("debería retornar el perfil del usuario sin el hash de contraseña", async () => {
      mockUsersModel.getProfile.mockResolvedValue(mockUser);

      const result = await UsersService.getProfile(userId);

      expect(mockUsersModel.getProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserDto);
      expect(result).not.toHaveProperty("passwordHash");
    });

    test("debería lanzar AppError 404 si el usuario no se encuentra", async () => {
      mockUsersModel.getProfile.mockResolvedValue(null);

      await expect(UsersService.getProfile(userId)).rejects.toThrow(AppError);
      await expect(UsersService.getProfile(userId)).rejects.toMatchObject({
        statusCode: 404,
        message: "Usuario no encontrado",
      });
    });
  });

  describe("updateProfile", () => {
    test("debería actualizar el perfil (sin cambiar email) y retornar el DTO", async () => {
      const updateData = { lastName: "Gomez" };
      const updatedUser = { ...mockUser, lastName: "Gomez" };
      const updatedUserDto = { ...mockUserDto, lastName: "Gomez" };

      mockUsersModel.getProfile.mockResolvedValue(mockUser);
      mockUsersModel.updateProfile.mockResolvedValue(updatedUser);

      const result = await UsersService.updateProfile(userId, updateData);

      expect(mockUsersModel.getProfile).toHaveBeenCalledWith(userId);

      expect(mockUsersModel.getByEmail).not.toHaveBeenCalled();
      expect(mockUsersModel.updateProfile).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result).toEqual(updatedUserDto);
      expect(result).not.toHaveProperty("passwordHash");
    });

    test("debería actualizar el perfil (cambiando email) si el email está disponible", async () => {
      const updateData = { email: "nuevo@test.com" };
      const updatedUser = { ...mockUser, email: "nuevo@test.com" };
      const updatedUserDto = { ...mockUserDto, email: "nuevo@test.com" };

      mockUsersModel.getProfile.mockResolvedValue(mockUser);
      mockUsersModel.getByEmail.mockResolvedValue(null);
      mockUsersModel.updateProfile.mockResolvedValue(updatedUser);

      const result = await UsersService.updateProfile(userId, updateData);

      expect(mockUsersModel.getProfile).toHaveBeenCalledWith(userId);
      expect(mockUsersModel.getByEmail).toHaveBeenCalledWith("nuevo@test.com");
      expect(mockUsersModel.updateProfile).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result).toEqual(updatedUserDto);
    });

    test("debería lanzar AppError 409 si el email a actualizar ya está en uso", async () => {
      const updateData = { email: "otro@test.com" };
      const otherUser = { ...mockUser, id: "user-456", email: "otro@test.com" };

      mockUsersModel.getProfile.mockResolvedValue(mockUser);
      mockUsersModel.getByEmail.mockResolvedValue(otherUser);

      await expect(
        UsersService.updateProfile(userId, updateData)
      ).rejects.toThrow(AppError);
      await expect(
        UsersService.updateProfile(userId, updateData)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "El correo electrónico ya está en uso",
      });
      expect(mockUsersModel.updateProfile).not.toHaveBeenCalled();
    });

    test("debería no hacer nada si el email es el mismo del usuario actual", async () => {
      const updateData = { email: "juan@test.com" };
      const updatedUser = { ...mockUser };
      const updatedUserDto = { ...mockUserDto };

      mockUsersModel.getProfile.mockResolvedValue(mockUser);
      mockUsersModel.updateProfile.mockResolvedValue(updatedUser);

      const result = await UsersService.updateProfile(userId, updateData);

      expect(mockUsersModel.getProfile).toHaveBeenCalledWith(userId);
      expect(mockUsersModel.getByEmail).not.toHaveBeenCalled();
      expect(mockUsersModel.updateProfile).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result).toEqual(updatedUserDto);
    });

    test("debería lanzar AppError 404 si el usuario a actualizar no existe", async () => {
      mockUsersModel.getProfile.mockResolvedValue(null);

      await expect(UsersService.updateProfile(userId, {})).rejects.toThrow(
        AppError
      );
      await expect(
        UsersService.updateProfile(userId, {})
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Usuario no encontrado",
      });
    });
  });

  describe("deleteUser", () => {
    test("debería eliminar al usuario si existe", async () => {
      mockUsersModel.getProfile.mockResolvedValue(mockUser);
      mockUsersModel.delete.mockResolvedValue(mockUser);

      const result = await UsersService.deleteUser(userId);

      expect(mockUsersModel.getProfile).toHaveBeenCalledWith(userId);
      expect(mockUsersModel.delete).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    test("debería lanzar AppError 404 si el usuario a eliminar no existe", async () => {
      mockUsersModel.getProfile.mockResolvedValue(null);

      await expect(UsersService.deleteUser(userId)).rejects.toThrow(AppError);
      await expect(UsersService.deleteUser(userId)).rejects.toMatchObject({
        statusCode: 404,
        message: "Usuario no encontrado",
      });
      expect(mockUsersModel.delete).not.toHaveBeenCalled();
    });
  });
});
