import { z } from "zod";

export const createClientSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .regex(/^[A-Za-z\s]+$/, "First name must contain letters only"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .regex(/^[A-Za-z\s]+$/, "Last name must contain letters only"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export type CreateWalkInClientInput = z.infer<typeof createClientSchema>;
