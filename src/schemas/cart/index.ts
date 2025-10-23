import z from "zod";
import { numberIdSchema } from "../globals";

// --- Schemas de Entrada (Datos Crudos) ---

const cartItemInpSchema = z.object({
  productId: z.uuid("El ID del producto debe ser un UUID válido."),
  quantity: z.coerce
    .number("La cantidad es obligatoria.")
    .int("La cantidad debe ser un número entero.")
    .min(1, "La cantidad debe ser al menos 1."),
});

// Schema (PATCH)
const partialCartItemInpSchema = z.object({
  quantity: z.coerce
    .number("La cantidad es obligatoria.")
    .int("La cantidad debe ser un número entero.")
    .min(1, "La cantidad debe ser al menos 1."),
});

// --- Schemas para validateRequest ---

// POST /cart/items
export const createCartItemSchema = z.object({
  body: cartItemInpSchema,
});

// PATCH /cart/items/:itemId
export const updateCartItemSchema = numberIdSchema.extend({
  body: partialCartItemInpSchema,
});

// --- Tipos Inferidos ---
export type CartItemInput = z.infer<typeof cartItemInpSchema>;
export type UpdateCartItemInput = z.infer<typeof partialCartItemInpSchema>;
