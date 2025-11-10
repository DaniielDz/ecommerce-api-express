import { AppError } from "../errors/AppError";
import { UsersModel } from "../models/users";
import { PatchUserInput } from "../schemas/users";

export class UsersService {
  static async getProfile(userId: string) {
    const user = await UsersModel.getProfile(userId);
    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const { passwordHash, ...userDto } = user;

    return userDto;
  }

  static async updateProfile(userId: string, newData: PatchUserInput) {
    const existingUser = await UsersModel.getProfile(userId);
    if (!existingUser) {
      throw new AppError("Usuario no encontrado", 404);
    }

    if (newData.email && newData.email !== existingUser.email) {
      const emailTaken = await UsersModel.getByEmail(newData.email);
      if (emailTaken) {
        throw new AppError("El correo electrónico ya está en uso", 409);
      }
    }

    const updatedUser = await UsersModel.updateProfile(userId, newData);
    const { passwordHash, ...userDto } = updatedUser;

    return userDto;
  }

  static async deleteUser(userId: string) {
    const existingUser = await UsersModel.getProfile(userId);
    if (!existingUser) {
      throw new AppError("Usuario no encontrado", 404);
    }

    return await UsersModel.delete(userId);
  }
}
