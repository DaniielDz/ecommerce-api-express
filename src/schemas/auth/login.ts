import z from "zod";

const inputSchema = z.object({
  email: z.email("El formato del correo no es válido"),
  password: z
    .string("La contraseña es requerida")
    .min(1, "Por favor, ingresa tu contraseña"),
});

export const loginSchema = z.object({
  body: inputSchema,
});
