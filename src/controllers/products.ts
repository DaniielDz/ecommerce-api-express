import { NextFunction, Request, Response } from "express";
import { ProductsService } from "../services/products";
import { ProductPatch, ProductPost } from "../schemas/products/body";
import { ProductsFilters } from "../schemas/products/query";
import { AppError } from "../errors/AppError";

export class ProductsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.validatedData?.query as ProductsFilters;

      const result = await ProductsService.getAll(filters);

      if (!result.ok) {
        const message =
          result.error === "DB_ERROR"
            ? "Ocurrió un error en la base de datos"
            : "Error interno del servidor";
        return next(new AppError(message, 500));
      }

      return res.json(result.data);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.validatedData?.params as { id: string };

      const result = await ProductsService.getById(id);

      if (!result.ok) {
        let status = 500;
        let message = "Error interno del servidor";

        if (result.error === "PRODUCT_NOT_FOUND") {
          status = 404;
          message = "Producto no encontrado";
        } else if (result.error === "DB_ERROR") {
          message = "Error en la base de datos";
        }

        return next(new AppError(message, status));
      }

      return res.json(result.data);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const newProduct = req.validatedData?.body as ProductPost;

      const result = await ProductsService.create(newProduct);

      if (!result.ok) {
        let status = 500;
        let message = "Error interno del servidor";

        if (result.error === "DB_ERROR") {
          message = "Error en la base de datos";
        }

        return next(new AppError(message, status));
      }

      return res.status(201).json(result.data);
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.validatedData?.params as { id: string };

      const result = await ProductsService.delete(id);

      if (!result.ok) {
        let status = 500;
        let message = "Error interno del servidor";

        if (result.error === "PRODUCT_NOT_FOUND") {
          status = 404;
          message = "Producto no encontrado";
        } else if (result.error === "DB_ERROR") {
          message = "Error en la base de datos";
        }

        return next(new AppError(message, status));
      }

      return res.json(result.data);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.validatedData?.params as { id: string };
      const productData = req.validatedData?.body as ProductPatch;

      const result = await ProductsService.update(id, productData);

      if (!result.ok) {
        let status = 500;
        let message = "Error interno del servidor";

        if (result.error === "PRODUCT_NOT_FOUND") {
          status = 404;
          message = "Producto no encontrado";
        } else if (result.error === "DB_ERROR") {
          message = "Error en la base de datos";
        }

        return next(new AppError(message, status));
      }

      return res.json(result.data);
    } catch (error) {
      return next(error);
    }
  }

  static async replace(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.validatedData?.params as { id: string };
      const productData = req.validatedData?.body as ProductPost;

      const result = await ProductsService.replace(id, productData);

      if (!result.ok) {
        let status = 500;
        let message = "Error interno del servidor";

        if (result.error === "PRODUCT_NOT_FOUND") {
          status = 404;
          message = "Producto no encontrado";
        } else if (result.error === "DB_ERROR") {
          message = "Error en la base de datos";
        }

        return next(new AppError(message, status));
      }

      return res.json(result.data);
    } catch (error) {
      return next(error);
    }
  }
}
