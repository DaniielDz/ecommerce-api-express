import { PublicUser, RegisterParams } from "../types";
import { prisma } from "../utils/prismaClient";

export class AuthModel {
  static async register({ email, passwordHash, firstName, lastName }: RegisterParams) {
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
    });

    const { passwordHash: _, ...publicUser } = newUser;

    return publicUser as PublicUser;
  }

  static async getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  }

  static async getUsers() {
    const users = await prisma.user.findMany();

    return users;
  }
}
