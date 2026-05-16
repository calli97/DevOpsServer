import { createHmac } from "crypto";
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

export interface SlaveNginxReadResponse {
  ok: boolean;
  content?: string;
  error?: string;
}

export interface SlaveNginxWriteResponse {
  ok: boolean;
  error?: string;
}

export class SlaveServerClient {
  private getBaseUrl(slaveServer: SlaveServer): string {
    const port = slaveServer.puerto ? `:${slaveServer.puerto}` : "";
    return `${slaveServer.host}${port}`;
  }

  private sign(secret: string, method: string, path: string, timestamp: string, body: string): string {
    const payload = `${method}\n${path}\n${timestamp}\n${body}`;
    return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
  }

  private getHeaders(slaveServer: SlaveServer, method: string, path: string, body: string = ""): Record<string, string> {
    const timestamp = String(Date.now());
    return {
      "Content-Type": "application/json",
      "x-timestamp": timestamp,
      "x-signature": this.sign(slaveServer.apiKey, method, path, timestamp, body),
    };
  }

  async status(
    slaveServer: SlaveServer,
  ): Promise<{ ok: boolean; error?: string }> {
    const url = `${this.getBaseUrl(slaveServer)}/status`;

    logger.info(
      `[SlaveServerClient] Checking status of ${slaveServer.nombre} (${url})`,
    );

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(slaveServer, "GET", "/status"),
      });
      console.log("Response Log:", response);
      const data = (await response.json()) as { ok: boolean };
      return data;
    } catch (error) {
      logger.warning(
        `[SlaveServerClient] Status check failed for ${slaveServer.nombre}:`,
        error,
      );
      console.log("ERROR:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async clone(
    slaveServer: SlaveServer,
    cloneLine: string,
    instancePath: string,
  ): Promise<SlaveCloneResponse> {
    const url = `${this.getBaseUrl(slaveServer)}/clone`;
    const body: SlaveCloneRequest = { cloneLine, path: instancePath };
    const bodyStr = JSON.stringify(body);

    logger.info(
      `[SlaveServerClient] Sending clone request to ${slaveServer.nombre} (${url})`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(slaveServer, "POST", "/clone", bodyStr),
      body: bodyStr,
    });

    const data = (await response.json()) as SlaveCloneResponse;

    if (!response.ok) {
      logger.error(
        `[SlaveServerClient] Clone request failed (${response.status}):`,
        data,
      );
    } else {
      logger.success(
        `[SlaveServerClient] Clone request succeeded for ${slaveServer.nombre}`,
      );
    }

    return data;
  }

  async readNginxConfig(
    slaveServer: SlaveServer,
    filePath: string,
    name: string,
  ): Promise<SlaveNginxReadResponse> {
    const routePath = "/nginx-config/read";
    const params = new URLSearchParams({ path: filePath, name });
    const url = `${this.getBaseUrl(slaveServer)}${routePath}?${params}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(slaveServer, "GET", routePath),
      });
      return response.json() as Promise<SlaveNginxReadResponse>;
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async writeNginxConfig(
    slaveServer: SlaveServer,
    filePath: string,
    name: string,
    content: string,
  ): Promise<SlaveNginxWriteResponse> {
    const routePath = "/nginx-config/write";
    const bodyStr = JSON.stringify({ path: filePath, name, content });
    const url = `${this.getBaseUrl(slaveServer)}${routePath}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(slaveServer, "POST", routePath, bodyStr),
        body: bodyStr,
      });
      return response.json() as Promise<SlaveNginxWriteResponse>;
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async deploy(
    slaveServer: SlaveServer,
    request: SlaveDeployRequest,
  ): Promise<SlaveDeployResponse> {
    const url = `${this.getBaseUrl(slaveServer)}/deploy`;
    const bodyStr = JSON.stringify(request);

    logger.info(
      `[SlaveServerClient] Sending deploy request to ${slaveServer.nombre} (${url})`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(slaveServer, "POST", "/deploy", bodyStr),
      body: bodyStr,
    });

    const data = (await response.json()) as SlaveDeployResponse;

    if (!response.ok) {
      logger.error(
        `[SlaveServerClient] Deploy request failed (${response.status}):`,
        data,
      );
    } else if (data.errors.length > 0) {
      logger.warning(
        `[SlaveServerClient] Deploy completed with errors on ${slaveServer.nombre}:`,
        data.errors,
      );
    } else {
      logger.success(
        `[SlaveServerClient] Deploy succeeded on ${slaveServer.nombre}`,
      );
    }

    return data;
  }
}
