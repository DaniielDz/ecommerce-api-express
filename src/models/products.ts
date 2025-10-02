import { Prisma, Product,  } from "@prisma/client";
import { prisma } from "../utils/prismaClient";
import { ProductsFilters } from "../schemas/products";

export class ProductsModel {
  static async getAll(filters?: ProductsFilters): Promise<Product[]> {
    const { name, priceRange } = filters ?? {};
    const whereCondition: Prisma.ProductWhereInput = {};

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

    const products = await prisma.product.findMany({ where: whereCondition });

    return products;
  }
}
