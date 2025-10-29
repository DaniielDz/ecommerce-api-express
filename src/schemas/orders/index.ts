// src/schemas/orders/index.ts
import { z } from "zod";

// --- Schemas de Entrada ---
// Esquema para la dirección de envío
const shippingAddressSchema = z.object(
  {
    street: z
      .string("La calle es obligatoria.")
      .trim()
      .min(1, "La calle no puede estar vacía."),
    apartment: z.string().trim().optional().nullable(),
    city: z
      .string("La ciudad es obligatoria.")
      .trim()
      .min(1, "La ciudad no puede estar vacía."),
    province: z
      .string("La provincia es obligatoria.")
      .trim()
      .min(1, "La provincia no puede estar vacía."),
    postalCode: z
      .string("El código postal es obligatorio.")
      .trim()
      .min(1, "El código postal no puede estar vacío."),
    country: z
      .string("El país es obligatorio.")
      .trim()
      .min(1, "El país no puede estar vacío."),
    recipientName: z.string().trim().optional().nullable(),
  },
  "La dirección de envío es obligatoria."
);

// Esquema para los parámetros de consulta de paginación (GET /orders)
const getAllOrdersQuerySchema = z.object({
  page: z.coerce
    .number("La página debe ser un número.")
    .int("La página debe ser un entero.")
    .positive("La página debe ser un número positivo.")
    .optional()
    .default(1),

  limit: z.coerce
    .number("El límite debe ser un número.")
    .int("El límite debe ser un entero.")
    .positive("El límite debe ser positivo.")
    .optional()
    .default(10),
});

// --- Schemas para el Middleware `validateRequest` ---
// Para POST /orders
export const createOrderSchema = z.object({
  body: shippingAddressSchema,
});

// Para GET /orders (validar query params)
export const getAllOrdersSchema = z.object({
  query: getAllOrdersQuerySchema,
});

// --- Tipos Inferidos ---
// Tipo para los datos que vienen en el body al crear una orden
export type CreateOrderInput = z.infer<typeof shippingAddressSchema>;
// Tipo para los query params de paginación
export type GetAllOrdersQuery = z.infer<typeof getAllOrdersQuerySchema>;
