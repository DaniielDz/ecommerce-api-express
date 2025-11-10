import { z } from "zod";

const patchUserSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "El nombre debe tener entre 1 y 100 caracteres")
      .max(100, "El nombre debe tener entre 1 y 100 caracteres"),
    lastName: z
      .string()
      .min(1, "El apellido debe tener entre 1 y 100 caracteres")
      .max(100, "El apellido debe tener entre 1 y 100 caracteres"),
    email: z.email("El correo electrónico no es válido"),
  })
  .partial();

export const patchUserSchemaValidation = z.object({
  body: patchUserSchema,
});

export type PatchUserInput = z.infer<typeof patchUserSchema>;
