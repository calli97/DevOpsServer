import { z } from "zod";

export const createSlaveServerSchema = z.object({
  nombre: z.string().min(1, "nombre is required"),
  direccionIp: z.string().min(1, "direccionIp is required"),
  puerto: z.number().int().positive("puerto must be a positive integer"),
  apiKey: z.string().min(1, "apiKey is required"),
});

export const updateSlaveServerSchema = z.object({
  nombre: z.string().min(1, "nombre cannot be empty").optional(),
  direccionIp: z.string().min(1, "direccionIp cannot be empty").optional(),
  puerto: z.number().int().positive("puerto must be a positive integer").optional(),
  apiKey: z.string().min(1, "apiKey cannot be empty").optional(),
});

export type CreateSlaveServerDto = z.infer<typeof createSlaveServerSchema>;
export type UpdateSlaveServerDto = z.infer<typeof updateSlaveServerSchema>;
