import z from "zod";

const inputSchema = z.object({
  email: z.email("Por favor, ingresa un correo electrónico válido"),
  password: z
    .string("La contraseña es requerida")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
  firstName: z
    .string("El nombre es requerido")
    .min(1, "El nombre no puede estar vacío"),
  lastName: z
    .string("El apellido es requerido")
    .min(1, "El apellido no puede estar vacío"),
});

export const registerSchema = z.object({
  body: inputSchema,
});
