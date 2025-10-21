import { AppError } from "../errors/AppError";
import { CategoriesModel } from "../models/categories";
import {
  CreateCategoryInput,
  GetAllCategoriesQuery,
  UpdateCategoryInput,
} from "../schemas/categories";

export class CategoriesService {
  static async getAll({ page, limit }: GetAllCategoriesQuery) {
    const offset = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      CategoriesModel.getAll({ offset, limit }),
      CategoriesModel.count(),
    ]);

    return {
      categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: number) {
    const category = await CategoriesModel.getById(id);

    if (!category) {
      throw new AppError(`No se encontró una categoria con id: ${id}`, 404);
    }

    return category;
  }

  static async create(newCategory: CreateCategoryInput) {
    await this.validateNameIsAvailable(newCategory.name);

    const created = await CategoriesModel.create(newCategory);
    return created;
  }

  static async delete(id: number) {
    await this.getById(id);

    const deleted = await CategoriesModel.delete(id);
    return deleted;
  }

  static async update(id: number, newData: UpdateCategoryInput) {
    await this.getById(id);

    if (newData.name) {
      await this.validateNameConflict(newData.name, id);
    }

    const updated = await CategoriesModel.update(id, newData);
    return updated;
  }

  static async replace(id: number, newData: CreateCategoryInput) {
    await this.getById(id);

    await this.validateNameConflict(newData.name, id);

    const replaced = await CategoriesModel.replace(id, newData);
    return replaced;
  }

  private static async validateNameIsAvailable(name: string) {
    const existCategory = await CategoriesModel.getByName(name);
    if (existCategory) {
      throw new AppError(`Ya existe la categoria con nombre: ${name}`, 409);
    }
  }

  private static async validateNameConflict(name: string, idToExclude: number) {
    const existCategory = await CategoriesModel.getByName(name);

    if (existCategory && existCategory.id !== idToExclude) {
      throw new AppError(`Ya existe la categoria con nombre: ${name}`, 409);
    }
  }
}
