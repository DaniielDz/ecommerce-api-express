import { z } from "zod";
import { numberIdSchema } from "../globals";

// DTO
const categoryInputSchema = z.object({
  name: z
    .string("El nombre es requerido")
    .trim()
    .min(3, "El nombre debe tener al menos 3 letras")
    .max(100, "El nombre debe tener 100 caracteres o menos"),

  description: z
    .string()
    .optional()
    .transform((val) => (val === "" || val === undefined ? null : val)),
});

// Partial DTO
const partialCategoryInputSchema = categoryInputSchema.partial();

// --- Definición de Esquemas ---

export const createCategorySchema = z.object({
  body: categoryInputSchema,
});

export const updateCategorySchema = z.object({
  ...numberIdSchema.shape,
  body: categoryInputSchema,
});

export const patchCategorySchema = z.object({
  ...numberIdSchema.shape,
  body: partialCategoryInputSchema,
});

// --- Tipos ---
export type CreateCategoryInput = z.infer<typeof categoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof partialCategoryInputSchema>;
