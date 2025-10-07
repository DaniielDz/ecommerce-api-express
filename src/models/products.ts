import { Prisma, Product } from "@prisma/client";
import { prisma } from "../utils/prismaClient";
import {
  ProductPatch,
  ProductPost,
  ProductsFilters,
} from "../schemas/products";

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

  static async getById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({ where: { id } });

    return product;
  }

  static async create(newProduct: ProductPost) {
    const { categoryId, ...productData } = newProduct;
    const dataToCreate: Prisma.ProductCreateInput = {
      ...productData,
      imageUrl: productData.imageUrl ?? null,
      category: { connect: { id: categoryId } },
    };
    const productCreated = await prisma.product.create({ data: dataToCreate });
    return productCreated;
  }

  static async delete(id: string) {
    const productDeleted = await prisma.product.delete({
      where: { id },
    });

    return productDeleted;
  }

  static async update(id: string, productData: ProductPatch) {
    const productUpdated = await prisma.product.update({
      where: { id },
      data: productData as Prisma.ProductUpdateInput,
    });

    return productUpdated;
  }

  static async replace(id: string, productData: ProductPost) {
    const { categoryId, ...newData } = productData;
    const dataToReplace: Prisma.ProductUpdateInput = {
      ...newData,
      imageUrl: newData.imageUrl ?? null,
      category: { connect: { id: categoryId } },
    };
    const productReplaced = await prisma.product.update({
      where: { id },
      data: dataToReplace,
    });

    return productReplaced;
  }
}
