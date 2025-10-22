import { CategoriesModel } from "../../../src/models/categories";
import { CategoriesService } from "../../../src/services/categories";
import { AppError } from "../../../src/errors/AppError";

jest.mock("../../../src/models/categories");
jest.mock("../../../src/errors/AppError", () => ({
  AppError: jest.fn().mockImplementation((message, statusCode) => {
    const error = new Error(message);
    (error as any).statusCode = statusCode;
    return error;
  }),
}));

const mockModel = jest.mocked(CategoriesModel);
const mockAppError = jest.mocked(AppError);

const mockCategory = {
  id: 1,
  name: "Electrónica",
  description: "Dispositivos electrónicos",
};

describe("CategoriesService", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getAll", () => {
    test("debería retornar categorías con metadatos de paginación", async () => {
      const mockCategories = [mockCategory];
      const mockTotal = 1;

      mockModel.getAll.mockResolvedValue(mockCategories);
      mockModel.count.mockResolvedValue(mockTotal);

      const result = await CategoriesService.getAll({ page: 1, limit: 10 });

      expect(mockModel.getAll).toHaveBeenCalledWith({ offset: 0, limit: 10 });
      expect(mockModel.count).toHaveBeenCalled();

      expect(result).toEqual({
        categories: mockCategories,
        meta: {
          total: mockTotal,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    test("debería calcular correctamente el offset para páginas > 1", async () => {
      mockModel.getAll.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(30);

      await CategoriesService.getAll({ page: 3, limit: 10 });

      expect(mockModel.getAll).toHaveBeenCalledWith({ offset: 20, limit: 10 });
    });

    test("debería calcular correctamente totalPages", async () => {
      mockModel.getAll.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(25);

      const result = await CategoriesService.getAll({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
    });

    test("debería manejar una lista vacía de categorías", async () => {
      mockModel.getAll.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(0);

      const result = await CategoriesService.getAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        categories: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });
    });
  });

  describe("getById", () => {
    test("deberia retornar una categoria si la encuentra", async () => {
      mockModel.getById.mockResolvedValue(mockCategory);

      const result = await CategoriesService.getById(1);

      expect(mockModel.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCategory);
    });

    test("debería lanzar un AppError 404 si la categoría no existe", async () => {
      mockModel.getById.mockResolvedValue(null);

      await expect(CategoriesService.getById(99)).rejects.toThrow(
        "No se encontró una categoria con id: 99"
      );

      expect(mockAppError).toHaveBeenCalledWith(
        "No se encontró una categoria con id: 99",
        404
      );
    });
  });

  describe("create", () => {
    const input = { name: "Ropa", description: "Vestimenta" };

    test("debería crear una categoría si el nombre está disponible", async () => {
      mockModel.getByName.mockResolvedValue(null);
      mockModel.create.mockResolvedValue({ id: 2, ...input });

      const result = await CategoriesService.create(input);

      expect(mockModel.getByName).toHaveBeenCalledWith(input.name);
      expect(mockModel.create).toHaveBeenCalledWith(input);
      expect(result).toEqual({ id: 2, ...input });
    });

    test("debería lanzar un AppError 409 si el nombre ya existe", async () => {
      mockModel.getByName.mockResolvedValue(mockCategory);

      await expect(CategoriesService.create(input)).rejects.toThrow(
        `Ya existe la categoria con nombre: ${input.name}`
      );

      expect(mockAppError).toHaveBeenCalledWith(
        `Ya existe la categoria con nombre: ${input.name}`,
        409
      );
    });
  });

  describe("delete", () => {
    test("debería eliminar una categoría existente", async () => {
      mockModel.getById.mockResolvedValue(mockCategory);
      mockModel.delete.mockResolvedValue(mockCategory);

      const result = await CategoriesService.delete(1);

      expect(mockModel.getById).toHaveBeenCalledWith(1);
      expect(mockModel.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCategory);
    });

    test("debería lanzar un AppError 404 si la categoría no existe", async () => {
      mockModel.getById.mockResolvedValue(null);

      await expect(CategoriesService.delete(99)).rejects.toThrow(
        "No se encontró una categoria con id: 99"
      );

      expect(mockAppError).toHaveBeenCalledWith(
        "No se encontró una categoria con id: 99",
        404
      );
    });
  });

  describe("update", () => {
    const updateData = { description: "Nueva descripción" };

    test("debería actualizar una categoría existente", async () => {
      mockModel.getById.mockResolvedValue(mockCategory);
      mockModel.update.mockResolvedValue({ ...mockCategory, ...updateData });

      const result = await CategoriesService.update(1, updateData);

      expect(mockModel.getById).toHaveBeenCalledWith(1);
      expect(mockModel.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual({ ...mockCategory, ...updateData });
    });

    test("debería lanzar un AppError 404 si la categoría no existe", async () => {
      mockModel.getById.mockResolvedValue(null);

      await expect(CategoriesService.update(99, updateData)).rejects.toThrow(
        "No se encontró una categoria con id: 99"
      );

      expect(mockAppError).toHaveBeenCalledWith(
        "No se encontró una categoria con id: 99",
        404
      );
    });

    test("debería lanzar un AppError 409 si el nuevo nombre ya existe en otra categoría", async () => {
      const conflictingCategory = {
        id: 2,
        name: "Hogar",
        description: "Artículos para el hogar",
      };
      mockModel.getById.mockResolvedValue(mockCategory);
      mockModel.getByName.mockResolvedValue(conflictingCategory);

      await expect(
        CategoriesService.update(1, { name: "Hogar" })
      ).rejects.toThrow(`Ya existe la categoria con nombre: Hogar`);

      expect(mockAppError).toHaveBeenCalledWith(
        `Ya existe la categoria con nombre: Hogar`,
        409
      );
    });
  });

  describe("replace", () => {
    const replaceData = {
      name: "Hogar",
      description: "Artículos para el hogar",
    };

    test("debería reemplazar una categoría existente", async () => {
      mockModel.getById.mockResolvedValue(mockCategory);
      mockModel.getByName.mockResolvedValue(null);
      mockModel.replace.mockResolvedValue({ id: 1, ...replaceData });

      const result = await CategoriesService.replace(1, replaceData);

      expect(mockModel.getById).toHaveBeenCalledWith(1);
      expect(mockModel.getByName).toHaveBeenCalledWith(replaceData.name);
      expect(mockModel.replace).toHaveBeenCalledWith(1, replaceData);
      expect(result).toEqual({ id: 1, ...replaceData });
    });

    test("debería lanzar un AppError 404 si la categoría no existe", async () => {
      mockModel.getById.mockResolvedValue(null);

      await expect(CategoriesService.replace(99, replaceData)).rejects.toThrow(
        "No se encontró una categoria con id: 99"
      );

      expect(mockAppError).toHaveBeenCalledWith(
        "No se encontró una categoria con id: 99",
        404
      );
    });

    test("debería lanzar un AppError 409 si el nuevo nombre ya existe en otra categoría", async () => {
      const conflictingCategory = {
        id: 2,
        name: "Hogar",
        description: "Artículos para el hogar",
      };
      mockModel.getById.mockResolvedValue(mockCategory);
      mockModel.getByName.mockResolvedValue(conflictingCategory);

      await expect(CategoriesService.replace(1, replaceData)).rejects.toThrow(
        `Ya existe la categoria con nombre: Hogar`
      );

      expect(mockAppError).toHaveBeenCalledWith(
        `Ya existe la categoria con nombre: Hogar`,
        409
      );
    });
  });
});
