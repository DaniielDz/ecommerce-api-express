import { Request, Response } from "express";
import { ProductsService } from "../services/products";

export class ProductsController {
  static async getAll(req: Request, res: Response) {
    const filters = req.productFilters ?? undefined

    const result = await ProductsService.getAll(filters);

    if (!result.ok) {
      const message =
        result.error === "DB_ERROR"
          ? "Ocurrió un error en la base de datos"
          : "Error interno del servidor";
      return res.status(500).json({ error: message });
    }

    return res.status(200).json(result.data);
  }
}
