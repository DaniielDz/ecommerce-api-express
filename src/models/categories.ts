import { Prisma } from "@prisma/client";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../schemas/categories";
import { prisma } from "../utils/prismaClient";

export class CategoriesModel {
  static async getAll() {
    return await prisma.category.findMany();
  }

  static async getById(id: number) {
    return await prisma.category.findUnique({ where: { id } });
  }
  static async getByName(name: string) {
    return await prisma.category.findUnique({ where: { name } });
  }

  static async create(newCategory: CreateCategoryInput) {
    return await prisma.category.create({ data: newCategory });
  }

  static async delete(id: number) {
    return await prisma.category.delete({ where: { id } });
  }

  static async update(id: number, newData: UpdateCategoryInput) {
    return await prisma.category.update({
      where: { id },
      data: newData as Prisma.CategoryUpdateInput,
    });
  }

  static async replace(id: number, newData: CreateCategoryInput) {
    return await prisma.category.update({
      where: { id },
      data: newData,
    });
  }
}
