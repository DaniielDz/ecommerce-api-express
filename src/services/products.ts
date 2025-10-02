import { Prisma, Products } from "@prisma/client";
import { DomainError, InfraError, Result } from "../types";
import { ProductsModel } from "../models/products";
import { ProductsFilters } from "../schemas/products";

export class ProductsService {
  static async getAll(
    filters?: ProductsFilters 
  ): Promise<Result<Products[], DomainError | InfraError>> {
    try {
      const products = await ProductsModel.getAll(filters);
      return { ok: true, data: products };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return { ok: false, error: "DB_ERROR" };
      }
      console.log("Error no clasificado en ProductsService", error);
      return { ok: false, error: "IO_ERROR" };
    }
  }
}
