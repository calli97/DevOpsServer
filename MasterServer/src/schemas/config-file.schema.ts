import { z } from "zod";

export const createConfigFileSchema = z.object({
  name: z.string().min(1, "name is required"),
  relativePath: z.string().min(1, "relativePath is required"),
  content: z.string().min(1, "content is required"),
  projectId: z.number().int().positive("projectId must be a positive integer"),
});

export const updateConfigFileSchema = z.object({
  name: z.string().min(1, "name cannot be empty").optional(),
  relativePath: z.string().min(1, "relativePath cannot be empty").optional(),
  content: z.string().min(1, "content cannot be empty").optional(),
});

export type CreateConfigFileDto = z.infer<typeof createConfigFileSchema>;
export type UpdateConfigFileDto = z.infer<typeof updateConfigFileSchema>;
