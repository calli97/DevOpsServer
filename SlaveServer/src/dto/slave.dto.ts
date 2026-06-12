import { z } from "zod";

// --- Interfaces ---

export interface DeployDto {
  name: string;
  startPath: string;
  buildCommands: string | null;
  startCommands: string;
  postStartCommands: string | null;
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
  command?: string;
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

export interface DeployLogDto {
  stdout: string;
  stderr: string;
}

export interface DeployOpResultDto {
  build?: DeployLogDto;
  start?: DeployLogDto;
  restart?: DeployLogDto;
  postStart?: DeployLogDto;
}

export interface DeployResultDto {
  name: string;
  build?: DeployLogDto;
  start?: DeployLogDto;
  restart?: DeployLogDto;
  postStart?: DeployLogDto;
}

export interface DeployResponse {
  ok: boolean;
  errors: DeployErrorDto[];
  results: DeployResultDto[];
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
  postStartCommands: z.string().nullable().optional(),
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
  command: z.string().optional(),
});

export const nginxReadQuerySchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
});

export const nginxWriteBodySchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
  content: z.string(),
});

export const deployRequestSchema = z.object({
  instancePath: z.string().min(1),
  branch: z.string().min(1),
  cloneLine: z.string().min(1),
  deploys: z.array(deployDtoSchema),
  configFiles: z.array(configFileDtoSchema),
  nginxConfigs: z.array(nginxConfigDtoSchema),
});

export interface StopRequest {
  instancePath: string;
  cloneLine: string;
  deployName: string;
  startPath: string;
}

export interface StopResponse {
  ok: boolean;
  error?: string;
  result?: DeployLogDto;
}

export const stopRequestSchema = z.object({
  instancePath: z.string().min(1),
  cloneLine: z.string().min(1),
  deployName: z.string().min(1),
  startPath: z.string(),
});

export interface NginxRunCommandsRequest { command: string; }
export interface NginxRunCommandsResponse { ok: boolean; stdout?: string; stderr?: string; error?: string; }
export const nginxRunCommandsBodySchema = z.object({ command: z.string().min(1) });

export interface NginxDeleteFileRequest { path: string; name: string; }
export interface NginxDeleteFileResponse { ok: boolean; error?: string; }
export const nginxDeleteFileBodySchema = z.object({ path: z.string().min(1), name: z.string().min(1) });

export interface ExecRequest { cmd: string; cwd: string; }
export interface ExecResponse { ok: boolean; stdout: string; stderr: string; }
export const execRequestSchema = z.object({
  cmd: z.string().min(1),
  cwd: z.string().min(1),
});
