import { z } from "zod";

export const createProjectInstanceSchema = z.object({
  name: z.string().min(1, "name is required"),
  branch: z.string().min(1, "branch is required"),
  path: z.string().min(1, "path is required"),
  autoUpdate: z.boolean().optional().default(false),
  afterDeployCommands: z.string().nullable().optional(),
  projectId: z.number().int().positive("projectId must be a positive integer"),
  slaveServerId: z.number().int().positive("slaveServerId must be a positive integer").nullable().optional(),
});

export const updateProjectInstanceSchema = z.object({
  name: z.string().min(1, "name cannot be empty").optional(),
  branch: z.string().min(1, "branch cannot be empty").optional(),
  path: z.string().min(1, "path cannot be empty").optional(),
  autoUpdate: z.boolean().optional(),
  afterDeployCommands: z.string().nullable().optional(),
  slaveServerId: z.number().int().positive("slaveServerId must be a positive integer").nullable().optional(),
});

export type CreateProjectInstanceDto = z.infer<typeof createProjectInstanceSchema>;
export type UpdateProjectInstanceDto = z.infer<typeof updateProjectInstanceSchema>;
