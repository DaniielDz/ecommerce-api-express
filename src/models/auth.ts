import { PublicUser, RegisterParams } from "../types";
import { prisma } from "../utils/prismaClient";

export class AuthModel {
  static async register({ username, password_hash }: RegisterParams) {
    const newUser = await prisma.user.create({
      data: {
        username,
        password_hash,
      },
    });

    const { password_hash: _, ...publicUser } = newUser;

    return publicUser as PublicUser;
  }

  static async getUserByUsername(username: string) {
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    return user;
  }

  static async getUsers() {
    const users = await prisma.user.findMany();

    return users;
  }
}
