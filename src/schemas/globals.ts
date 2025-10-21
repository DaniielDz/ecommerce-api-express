import z from "zod";

export const idSchema = z.object({
  params: {
    id: z.uuid(),
  },
});

export const numberIdSchema = z.object({
  params: {
    id: z.coerce
      .number("El id debe ser un número")
      .positive("El id debe ser un número positivo")
      .int("El id debe ser un número entero"),
  },
});
