import { z } from "zod";

export const createNginxConfigSchema = z.object({
  name: z.string().min(1, "name is required"),
  path: z.string().min(1, "path is required"),
  content: z.string().min(1, "content is required"),
  command: z.string().optional(),
  projectInstanceId: z.number().int().positive("projectInstanceId must be a positive integer"),
});

export const updateNginxConfigSchema = z.object({
  name: z.string().min(1, "name cannot be empty").optional(),
  path: z.string().min(1, "path cannot be empty").optional(),
  content: z.string().min(1, "content cannot be empty").optional(),
  command: z.string().optional(),
});

export const forceSyncSchema = z.object({
  source: z.enum(["stored", "current"]),
});

export const nginxTargetSchema = z.object({
  target: z.union([z.literal("master"), z.number().int().positive()]),
});

export type CreateNginxConfigDto = z.infer<typeof createNginxConfigSchema>;
export type UpdateNginxConfigDto = z.infer<typeof updateNginxConfigSchema>;
export type ForceSyncDto = z.infer<typeof forceSyncSchema>;
export type NginxTargetDto = z.infer<typeof nginxTargetSchema>;
