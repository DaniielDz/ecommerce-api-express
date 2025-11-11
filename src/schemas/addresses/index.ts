import { z } from "zod";
import { idSchema } from "../globals";

const bodySchema = z.object({
  addressLine1: z
    .string()
    .min(1, "La dirección no puede estar vacía")
    .max(255, "La dirección debe tener como máximo 255 caracteres"),
  addressLine2: z
    .string()
    .max(255, "La dirección debe tener como máximo 255 caracteres")
    .nullable(),
  city: z
    .string()
    .min(1, "La ciudad no puede estar vacía")
    .max(100, "La ciudad debe tener como máximo 100 caracteres"),
  state: z
    .string()
    .min(1, "El estado no puede estar vacío")
    .max(100, "El estado debe tener como máximo 100 caracteres"),
  postalCode: z
    .string()
    .min(1, "El código postal no puede estar vacío")
    .max(20, "El código postal debe tener como máximo 20 caracteres"),
  country: z
    .string()
    .min(1, "El país no puede estar vacío")
    .max(100, "El país debe tener como máximo 100 caracteres"),
  isDefault: z.boolean().optional(),
});

export const createAddressSchema = z.object({
  body: bodySchema,
});

export const updateAddressSchema = idSchema.extend({
  body: bodySchema.partial(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>["body"];
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>["body"];
