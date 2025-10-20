import z from "zod";

const inputSchema = z
  .object({
    name: z.string().optional(),
    minPrice: z.coerce
      .number("El precio minimo debe ser un número.")
      .positive("El precio minimo debe ser mayor a 0.")
      .optional(),
    maxPrice: z.coerce
      .number("El precio minimo debe ser un número.")
      .positive("El precio minimo debe ser mayor a 0.")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.minPrice && data.maxPrice) {
        return data.maxPrice >= data.minPrice;
      }

      return true;
    },
    {
      error: "El precio minimo no puede ser mayor que el precio máximo.",
      path: ["priceMin"],
    }
  );

export const productsQuerySchema = z.object({
  query: inputSchema,
});

const productsFiltersSchema = z.object({
  name: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
});

export type ProductsFilters = z.infer<typeof productsFiltersSchema>;
