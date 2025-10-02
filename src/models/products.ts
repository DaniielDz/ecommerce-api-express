import { Prisma, Products } from "@prisma/client";
import { prisma } from "../utils/prismaClient";
import { ProductsFilters } from "../schemas/products";

export class ProductsModel {
  static async getAll(filters?: ProductsFilters): Promise<Products[]> {
    const { name, priceRange } = filters ?? {};
    const whereCondition: Prisma.ProductsWhereInput = {};

    if (name) {
      whereCondition.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    if (priceRange) {
      whereCondition.price = {
        gte: priceRange.min,
        lte: priceRange.max,
      };
    }

    const products = await prisma.products.findMany({ where: whereCondition });

    return products;
  }
}
