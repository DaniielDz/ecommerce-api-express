import { Prisma, Product } from "@prisma/client";
import { DomainError, InfraError, Result } from "../types";
import { ProductsModel } from "../models/products";
import { ProductPatch, ProductPost, ProductsFilters } from "../schemas/products";

export class ProductsService {
  static async getAll(
    filters?: ProductsFilters
  ): Promise<Result<Product[], DomainError | InfraError>> {
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

  static async getById(
    id: string
  ): Promise<Result<Product, DomainError | InfraError>> {
    try {
      const product = await ProductsModel.getById(id);
      if (!product) {
        return { ok: false, error: "PRODUCT_NOT_FOUND" };
      }

      return { ok: true, data: product };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return { ok: false, error: "DB_ERROR" };
      }
      console.log("Error no clasificado en ProductsService", error);
      return { ok: false, error: "IO_ERROR" };
    }
  }

  static async create(newProduct: ProductPost) {
    try {
      const product = await ProductsModel.create(newProduct);
      return { ok: true, data: product };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return { ok: false, error: "DB_ERROR" };
      }
      console.log("Error no clasificado en ProductsService", error);
      return { ok: false, error: "IO_ERROR" };
    }
  }

  static async delete(
    id: string
  ): Promise<Result<Product, DomainError | InfraError>> {
    try {
      const productDeleted = await ProductsModel.delete(id);

      return { ok: true, data: productDeleted };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return { ok: false, error: "PRODUCT_NOT_FOUND" };
        }
        return { ok: false, error: "DB_ERROR" };
      }
      console.log("Error no clasificado en ProductsService", error);
      return { ok: false, error: "IO_ERROR" };
    }
  }

  static async update(
    id: string,
    productData: ProductPatch
  ): Promise<Result<Product, DomainError | InfraError>> {
    try {
      const productUpdated = await ProductsModel.update(id, productData);
      return { ok: true, data: productUpdated };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return { ok: false, error: "PRODUCT_NOT_FOUND" };
        }
        return { ok: false, error: "DB_ERROR" };
      }
      console.log("Error no clasificado en ProductsService", error);
      return { ok: false, error: "IO_ERROR" };
    }
  }

  static async replace(
    id: string,
    productData: ProductPost
  ): Promise<Result<Product, DomainError | InfraError>> {
    try {
      const productUpdated = await ProductsModel.replace(id, productData);
      return { ok: true, data: productUpdated };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return { ok: false, error: "PRODUCT_NOT_FOUND" };
        }
        return { ok: false, error: "DB_ERROR" };
      }
      console.log("Error no clasificado en ProductsService", error);
      return { ok: false, error: "IO_ERROR" };
    }
  }
}
