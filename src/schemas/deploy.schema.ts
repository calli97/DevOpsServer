import { z } from "zod";

const configFileSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, "name is required"),
  relativePath: z.string().min(1, "relativePath is required"),
  content: z.string().min(1, "content is required"),
});

const slaveServerSchema = z.object({
  id: z.number().int().positive().optional(),
  nombre: z.string().min(1, "nombre is required").optional(),
  direccionIp: z.string().min(1, "direccionIp is required").optional(),
  puerto: z.number().int().positive("puerto must be a positive integer").optional(),
  apiKey: z.string().min(1, "apiKey is required").optional(),
}).refine(
  (data) => {
    // If id is provided, other fields are optional (reference to existing)
    if (data.id) return true;
    // If no id, all fields are required (creating new)
    return data.nombre && data.direccionIp && data.puerto && data.apiKey;
  },
  { message: "Either provide id for existing SlaveServer or all fields for new one" }
);

export const createDeploySchema = z.object({
  name: z.string().min(1, "name is required"),
  path: z.string().min(1, "path is required"),
  repository: z.string().min(1, "repository is required"),
  branch: z.string().min(1, "branch is required"),
  buildCommands: z.string().optional(),
  afterDeployCommands: z.string().optional(),
  startCommands: z.string().min(1, "startCommands is required"),
  active: z.boolean().optional().default(true),
  autoUpdate: z.boolean().optional().default(false),
  configFiles: z.array(configFileSchema).optional(),
  slaveServer: slaveServerSchema.nullable().optional(),
});

export const updateDeploySchema = z.object({
  name: z.string().min(1, "name cannot be empty").optional(),
  path: z.string().min(1, "path cannot be empty").optional(),
  repository: z.string().min(1, "repository cannot be empty").optional(),
  branch: z.string().min(1, "branch cannot be empty").optional(),
  buildCommands: z.string().nullable().optional(),
  afterDeployCommands: z.string().nullable().optional(),
  startCommands: z.string().min(1, "startCommands cannot be empty").optional(),
  active: z.boolean().optional(),
  autoUpdate: z.boolean().optional(),
  configFiles: z.array(configFileSchema).optional(),
  slaveServer: slaveServerSchema.nullable().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "id must be a valid number").transform(Number),
});

export type CreateDeployDto = z.infer<typeof createDeploySchema>;
export type UpdateDeployDto = z.infer<typeof updateDeploySchema>;
