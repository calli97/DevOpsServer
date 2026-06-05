import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { NginxConfigDto } from "../dto/slave.dto";
import { logger } from "./LogService";

const execAsync = promisify(exec);

export class NginxConfigService {
  async writeAndApply(configs: NginxConfigDto[]): Promise<void> {
    if (configs.length === 0) {
      return;
    }

    for (const cfg of configs) {
      const filePath = path.join(cfg.path, cfg.name);
      await fs.writeFile(filePath, cfg.content, "utf-8");
      logger.info(`[NginxConfigService] Written: ${filePath}`);

      if (cfg.command) {
        const cmds: string[] = JSON.parse(cfg.command);
        if (Array.isArray(cmds) && cmds.length > 0) {
          const { stdout, stderr } = await execAsync(cmds.join(" && "));
          logger.info(`[NginxConfigService] Commands for ${cfg.name}:`, stdout);
          if (stderr) logger.warning(`[NginxConfigService] stderr:`, stderr);
        }
      }
    }

    const testResult = await this.testConfig();
    if (!testResult.ok) {
      throw new Error(`nginx config test failed: ${testResult.stderr}`);
    }

    await this.reload();
  }

  async testConfig(): Promise<{ ok: boolean; stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execAsync("sudo nginx -t");
      logger.info("[NginxConfigService] nginx -t:", stdout);
      if (stderr) logger.warning("[NginxConfigService] nginx -t stderr:", stderr);
      return { ok: true, stdout, stderr };
    } catch (error) {
      logger.error("[NginxConfigService] nginx -t failed:", error);
      return { ok: false, stdout: error.stdout ?? "", stderr: error.stderr ?? error.message };
    }
  }

  async readFile(filePath: string, name: string): Promise<string> {
    const fullPath = path.join(filePath, name);
    return fs.readFile(fullPath, "utf-8");
  }

  async writeFileOnly(filePath: string, name: string, content: string): Promise<void> {
    const fullPath = path.join(filePath, name);
    await fs.writeFile(fullPath, content, "utf-8");
    logger.info(`[NginxConfigService] Written: ${fullPath}`);
  }

  async runCommands(command: string): Promise<{ stdout: string; stderr: string }> {
    const cmds: string[] = JSON.parse(command);
    if (!Array.isArray(cmds) || cmds.length === 0) {
      throw new Error("command must be a non-empty JSON array");
    }
    const { stdout, stderr } = await execAsync(cmds.join(" && "));
    logger.info("[NginxConfigService] runCommands:", stdout);
    if (stderr) logger.warning("[NginxConfigService] stderr:", stderr);
    return { stdout, stderr };
  }

  async deleteFile(filePath: string, name: string): Promise<void> {
    const fullPath = path.join(filePath, name);
    await fs.unlink(fullPath);
    logger.info(`[NginxConfigService] Deleted: ${fullPath}`);
  }

  async reload(): Promise<{ ok: boolean; stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execAsync("sudo systemctl reload nginx");
      logger.info("[NginxConfigService] nginx reload:", stdout);
      if (stderr) logger.warning("[NginxConfigService] nginx reload stderr:", stderr);
      return { ok: true, stdout, stderr };
    } catch (error) {
      logger.error("[NginxConfigService] nginx reload failed:", error);
      return { ok: false, stdout: error.stdout ?? "", stderr: error.stderr ?? error.message };
    }
  }
}
