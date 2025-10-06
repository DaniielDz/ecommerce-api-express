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

export const productSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(255),
  price: z.number().positive(),
  image_url: z.url(),
});

export const productPatchSchema = productSchema.partial();

export type ProductPost = z.infer<typeof productSchema>;
export type ProductPatch = z.infer<typeof productPatchSchema>;
