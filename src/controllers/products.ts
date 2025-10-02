import { Request, Response } from "express";
import { ProductsService } from "../services/products";
import { idSchema } from "../schemas/products";

export class ProductsController {
  static async getAll(req: Request, res: Response) {
    const filters = req.productFilters ?? undefined;

    const result = await ProductsService.getAll(filters);

    if (!result.ok) {
      const message =
        result.error === "DB_ERROR"
          ? "Ocurrió un error en la base de datos"
          : "Error interno del servidor";
      return res.status(500).json({ error: message });
    }

    return res.json(result.data);
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const { success, data: parsedId } = idSchema.safeParse(id);

    if (!success) {
      return res.status(400).json({ error: "Formato de ID inválido" });
    }

    const result = await ProductsService.getById(parsedId);

    if (!result.ok) {
      let status = 500;
      let message = "Error interno del servidor";

      if (result.error === "PRODUCT_NOT_FOUND") {
        status = 404;
        message = "Producto no encontrado";
      } else if (result.error === "DB_ERROR") {
        message = "Error en la base de datos";
      }

      return res.status(status).json({ error: message });
    }

    return res.json(result.data);
  }
}
