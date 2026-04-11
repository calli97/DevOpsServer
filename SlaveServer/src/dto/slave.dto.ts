import { z } from "zod";

// --- Interfaces ---

export interface DeployDto {
  name: string;
  startPath: string;
  buildCommands: string | null;
  startCommands: string;
  started: boolean;
  isStaticSite: boolean;
}

export interface ConfigFileDto {
  name: string;
  relativePath: string;
  content: string;
}

export interface NginxConfigDto {
  name: string;
  path: string;
  content: string;
  command: string;
}

export interface CloneRequest {
  cloneLine: string;
  path: string;
}

export interface CloneResponse {
  ok: boolean;
  cloned: boolean;
  error?: string;
}

export interface DeployRequest {
  instancePath: string;
  branch: string;
  cloneLine: string;
  deploys: DeployDto[];
  configFiles: ConfigFileDto[];
  nginxConfigs: NginxConfigDto[];
}

export interface DeployErrorDto {
  deployName: string;
  error: string;
}

export interface DeployResponse {
  ok: boolean;
  errors: DeployErrorDto[];
}

// --- Zod schemas ---

export const cloneRequestSchema = z.object({
  cloneLine: z.string().min(1),
  path: z.string().min(1),
});

export const deployDtoSchema = z.object({
  name: z.string().min(1),
  startPath: z.string(),
  buildCommands: z.string().nullable().optional(),
  startCommands: z.string().min(1),
  started: z.boolean(),
  isStaticSite: z.boolean(),
});

export const configFileDtoSchema = z.object({
  name: z.string().min(1),
  relativePath: z.string(),
  content: z.string(),
});

export const nginxConfigDtoSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  content: z.string().min(1),
  command: z.string().min(1),
});

export const deployRequestSchema = z.object({
  instancePath: z.string().min(1),
  branch: z.string().min(1),
  cloneLine: z.string().min(1),
  deploys: z.array(deployDtoSchema),
  configFiles: z.array(configFileDtoSchema),
  nginxConfigs: z.array(nginxConfigDtoSchema),
});
