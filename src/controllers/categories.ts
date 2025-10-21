import { Request, Response, NextFunction } from "express";
import {
  CreateCategoryInput,
  GetAllCategoriesQuery,
  UpdateCategoryInput,
} from "../schemas/categories";
import { CategoriesService } from "../services/categories";

export class CategoriesController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query as unknown as GetAllCategoriesQuery;

      const result = await CategoriesService.getAll({ page, limit });

      return res.json({ status: "success", result });
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as unknown as { id: number };

      const category = await CategoriesService.getById(id);

      return res.json({ status: "success", category });
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body as unknown as CreateCategoryInput;

      const categoryCreated = await CategoriesService.create({
        name,
        description,
      });

      return res.status(201).json({ status: "success", categoryCreated });
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as unknown as { id: number };

      const categoryDeleted = await CategoriesService.delete(id);

      return res.json({ status: "success", categoryDeleted });
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as unknown as { id: number };
      const newData = req.body as unknown as UpdateCategoryInput;

      const categoryUpdated = await CategoriesService.update(id, newData);

      return res.json({ status: "success", categoryUpdated });
    } catch (error) {
      return next(error);
    }
  }

  static async replace(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as unknown as { id: number };
      const newData = req.body as unknown as CreateCategoryInput;

      const categoryUpdated = await CategoriesService.replace(id, newData);

      res.json({ status: "success", categoryUpdated });
    } catch (error) {
      return next(error)
    }
  }
}
