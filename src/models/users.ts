import { Prisma } from "@prisma/client";
import { PatchUserInput } from "../schemas/users";
import { prisma } from "../utils/prismaClient";

export class UsersModel {
  static async getProfile(userId: string) {
    return await prisma.user.findUnique({ where: { id: userId } });
  }

  static async getByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  static async updateProfile(userId: string, newData: PatchUserInput) {
    return await prisma.user.update({
      where: { id: userId },
      data: newData as Prisma.UserUpdateInput,
    });
  }

  static async delete(userId: string) {
    return await prisma.user.delete({ where: { id: userId } });
  }
}
