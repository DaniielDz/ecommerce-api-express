import { z } from "zod";

export const productsQuerySchema = z.object({
  name: z.string().optional(),
  priceRange: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return { min: 0, max: 1_000_000 };

      const parts = val.split(",").map(Number);
      if (parts.length !== 2 || parts.some(isNaN)) {
        throw new Error("Formato inválido, usa 'min,max'");
      }

      const [min, max] = parts;

      if (
        typeof min !== "number" ||
        typeof max !== "number" ||
        isNaN(min) ||
        isNaN(max)
      ) {
        throw new Error("Formato inválido, usa 'min,max'");
      }
      if (min < 0 || max < 0)
        throw new Error("Los valores no pueden ser negativos");
      if (min > max)
        throw new Error("El valor mínimo no puede ser mayor que el máximo");

      return { min, max };
    }),
});

export const productsFiltersSchema = z.object({
  name: z.string().optional(),
  priceRange: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .optional(),
});

export const idSchema = z.uuid();

export type ProductsFilters = z.infer<typeof productsFiltersSchema>;

export const createProductSchema = z.object({
  name: z
    .string({
      error: "El nombre del producto es obligatorio.",
    })
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(255, "El nombre no puede exceder los 255 caracteres."),

  description: z
    .string({
      error: "La descripción es obligatoria.",
    })
    .min(10, "La descripción debe tener al menos 10 caracteres."),

  sku: z
    .string({
      error: "El SKU es obligatorio.",
    })
    .min(1, "El SKU no puede estar vacío.")
    .max(100, "El SKU no puede exceder los 100 caracteres."),

  price: z.coerce
    .number({
      error: "El precio es obligatorio.",
    })
    .positive("El precio debe ser un número positivo.")
    .refine(
      (val) => {
        const decimalPart = val.toString().split(".")[1];
        return !decimalPart || decimalPart.length <= 2;
      },
      {
        message: "El precio puede tener como máximo dos decimales.",
      }
    ),

  stock: z.coerce
    .number({
      error: "El stock es obligatorio.",
    })
    .int("El stock debe ser un número entero.")
    .min(0, "El stock no puede ser negativo."),

  imageUrl: z
    .url("Debe ser una URL válida.")
    .optional() // El campo puede no estar presente
    .or(z.literal("")) // O puede ser un string vacío (típico de formularios)
    .transform((value) => (value === "" ? null : value)), // Si es vacío, lo convierte a null

  categoryId: z.coerce // Intenta convertir string a número
    .number({
      error: "La categoría es obligatoria.",
    })
    .int()
    .positive("El ID de la categoría no es válido."),
});

export const productPatchSchema = createProductSchema.partial();

export type ProductPost = z.infer<typeof createProductSchema>;
export type ProductPatch = z.infer<typeof productPatchSchema>;
