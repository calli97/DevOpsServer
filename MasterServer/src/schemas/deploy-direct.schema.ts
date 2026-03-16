import { z } from "zod";

export const createDeployDirectSchema = z.object({
  name: z.string().min(1, "name is required"),
  startPath: z.string().min(1, "startPath is required"),
  buildCommands: z.string().nullable().optional(),
  startCommands: z.string().min(1, "startCommands is required"),
  projectInstanceId: z.number().int().positive("projectInstanceId must be a positive integer"),
});

export const updateDeployDirectSchema = z.object({
  name: z.string().min(1, "name cannot be empty").optional(),
  startPath: z.string().min(1, "startPath cannot be empty").optional(),
  buildCommands: z.string().nullable().optional(),
  startCommands: z.string().min(1, "startCommands cannot be empty").optional(),
});

export type CreateDeployDirectDto = z.infer<typeof createDeployDirectSchema>;
export type UpdateDeployDirectDto = z.infer<typeof updateDeployDirectSchema>;
