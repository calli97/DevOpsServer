import SlaveServer from "../entity/SlaveServer";
import { logger } from "./LogService";

// DTOs mirrored from SlaveServer (no shared package)
export interface SlaveDeployDto {
  name: string;
  startPath: string;
  buildCommands: string | null;
  startCommands: string;
  started: boolean;
  isStaticSite: boolean;
}

export interface SlaveConfigFileDto {
  name: string;
  relativePath: string;
  content: string;
}

export interface SlaveNginxConfigDto {
  name: string;
  path: string;
  content: string;
  command: string;
}

export interface SlaveCloneRequest {
  cloneLine: string;
  path: string;
}

export interface SlaveCloneResponse {
  ok: boolean;
  cloned: boolean;
  error?: string;
}

export interface SlaveDeployRequest {
  instancePath: string;
  branch: string;
  cloneLine: string;
  deploys: SlaveDeployDto[];
  configFiles: SlaveConfigFileDto[];
  nginxConfigs: SlaveNginxConfigDto[];
}

export interface SlaveDeployResponse {
  ok: boolean;
  errors: { deployName: string; error: string }[];
}

export class SlaveServerClient {
  private getBaseUrl(slaveServer: SlaveServer): string {
    const port = slaveServer.puerto ? `:${slaveServer.puerto}` : "";
    return `${slaveServer.host}${port}`;
  }

  private getHeaders(slaveServer: SlaveServer): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": slaveServer.apiKey,
    };
  }

  async clone(
    slaveServer: SlaveServer,
    cloneLine: string,
    instancePath: string,
  ): Promise<SlaveCloneResponse> {
    const url = `${this.getBaseUrl(slaveServer)}/clone`;
    const body: SlaveCloneRequest = { cloneLine, path: instancePath };

    logger.info(`[SlaveServerClient] Sending clone request to ${slaveServer.nombre} (${url})`);

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(slaveServer),
      body: JSON.stringify(body),
    });

    const data = await response.json() as SlaveCloneResponse;

    if (!response.ok) {
      logger.error(`[SlaveServerClient] Clone request failed (${response.status}):`, data);
    } else {
      logger.success(`[SlaveServerClient] Clone request succeeded for ${slaveServer.nombre}`);
    }

    return data;
  }

  async deploy(
    slaveServer: SlaveServer,
    request: SlaveDeployRequest,
  ): Promise<SlaveDeployResponse> {
    const url = `${this.getBaseUrl(slaveServer)}/deploy`;

    logger.info(`[SlaveServerClient] Sending deploy request to ${slaveServer.nombre} (${url})`);

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(slaveServer),
      body: JSON.stringify(request),
    });

    const data = await response.json() as SlaveDeployResponse;

    if (!response.ok) {
      logger.error(`[SlaveServerClient] Deploy request failed (${response.status}):`, data);
    } else if (data.errors.length > 0) {
      logger.warning(`[SlaveServerClient] Deploy completed with errors on ${slaveServer.nombre}:`, data.errors);
    } else {
      logger.success(`[SlaveServerClient] Deploy succeeded on ${slaveServer.nombre}`);
    }

    return data;
  }
}
