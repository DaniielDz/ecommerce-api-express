import z from "zod";

export const idSchema = z.object({
  params: {
    id: z.uuid(),
  },
});
