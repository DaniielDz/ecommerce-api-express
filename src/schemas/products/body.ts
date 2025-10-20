import z from "zod";
import { idSchema } from "../globals";

const createInputSchema = z.object({
  name: z
    .string("El nombre del producto es obligatorio.")
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(255, "El nombre no puede exceder los 255 caracteres."),

  description: z
    .string("La descripción es obligatoria.")
    .min(10, "La descripción debe tener al menos 10 caracteres."),

  sku: z
    .string("El SKU es obligatorio.")
    .min(1, "El SKU no puede estar vacío.")
    .max(100, "El SKU no puede exceder los 100 caracteres."),

  price: z.coerce
    .number("El precio es obligatorio.")
    .positive("El precio debe ser un número positivo.")
    .refine(
      (val) => {
        const decimalPart = val.toString().split(".")[1];
        return !decimalPart || decimalPart.length <= 2;
      },
      {
        path: ["price"],
        error: "El precio puede tener como máximo dos decimales.",
      }
    ),

  stock: z.coerce
    .number("El stock es obligatorio.")
    .int("El stock debe ser un número entero.")
    .min(0, "El stock no puede ser negativo."),

  imageUrl: z
    .url("Debe ser una URL válida.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),

  categoryId: z.coerce
    .number("La categoría es obligatoria.")
    .int()
    .positive("El ID de la categoría no es válido."),
});

export const createProductSchema = z.object({
  body: createInputSchema,
});

const patchInputSchema = z.object({
  body: createInputSchema.partial(),
});

const putInputSchema = z.object({
  body: createInputSchema,
});

export const patchProductSchema = idSchema.extend(patchInputSchema.shape);
export const putProductSchema = idSchema.extend(putInputSchema.shape);

export type ProductPost = z.infer<typeof createProductSchema>;
export type ProductPut = z.infer<typeof patchInputSchema>;
export type ProductPatch = z.infer<typeof putInputSchema>;
