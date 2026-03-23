import { z } from "zod";

export const createNginxConfigSchema = z.object({
  name: z.string().min(1, "name is required"),
  path: z.string().min(1, "path is required"),
  content: z.string().min(1, "content is required"),
  command: z.string().min(1, "command is required"),
  projectInstanceId: z.number().int().positive("projectInstanceId must be a positive integer"),
});

export const updateNginxConfigSchema = z.object({
  name: z.string().min(1, "name cannot be empty").optional(),
  path: z.string().min(1, "path cannot be empty").optional(),
  content: z.string().min(1, "content cannot be empty").optional(),
  command: z.string().min(1, "command cannot be empty").optional(),
});

export type CreateNginxConfigDto = z.infer<typeof createNginxConfigSchema>;
export type UpdateNginxConfigDto = z.infer<typeof updateNginxConfigSchema>;
