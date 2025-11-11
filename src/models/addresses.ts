import { Prisma } from "@prisma/client";
import { CreateAddressInput, UpdateAddressInput } from "../schemas/addresses";
import { prisma } from "../utils/prismaClient";

export class AddressesModel {
  static async getAllByUserId(userId: string) {
    return await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: string) {
    return await prisma.address.findUnique({
      where: { id },
    });
  }

  static async create(data: CreateAddressInput, userId: string) {
    if (!data.isDefault) {
      return await prisma.address.create({
        data: {
          ...data,
          user: { connect: { id: userId } },
        } as Prisma.AddressCreateInput,
      });
    }

    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId: userId, isDefault: true },
        data: { isDefault: false },
      });

      const newAddress = await tx.address.create({
        data: {
          ...data,
          user: { connect: { id: userId } },
        } as Prisma.AddressCreateInput,
      });

      return newAddress;
    });
  }

  static async update(
    addressId: string,
    userId: string,
    data: UpdateAddressInput
  ) {
    if (data.isDefault !== true) {
      return await prisma.address.update({
        where: { id: addressId },
        data: data as Prisma.AddressUpdateInput,
      });
    }

    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: {
          userId: userId,
          isDefault: true,
          id: { not: addressId },
        },
        data: { isDefault: false },
      });

      const updatedAddress = await tx.address.update({
        where: { id: addressId },
        data: data as Prisma.AddressUpdateInput,
      });

      return updatedAddress;
    });
  }

  static async delete(addressId: string) {
    return await prisma.address.delete({
      where: { id: addressId },
    });
  }
}
