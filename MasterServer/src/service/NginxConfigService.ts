import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import NginxConfig from "../entity/NginxConfig";
import { getRepository } from "../dbConnection";
import { NotFoundError } from "../errors/AppError";
import { logger } from "./LogService";

const execAsync = promisify(exec);

export class NginxConfigService {
  async findById(id: number): Promise<NginxConfig | null> {
    const repository = await getRepository(NginxConfig);
    return repository.findOne({ where: { id } });
  }

  async findByProjectInstance(instanceId: number): Promise<NginxConfig[]> {
    const repository = await getRepository(NginxConfig);
    return repository.find({
      where: { projectInstance: { id: instanceId } },
      relations: { projectInstance: true },
    });
  }

  async create(data: Partial<NginxConfig>): Promise<NginxConfig> {
    const repository = await getRepository(NginxConfig);
    const nginxConfig = repository.create(data);
    await repository.save(nginxConfig);

    try {
      await fs.access(nginxConfig.path);
    } catch {
      throw new Error(`Path does not exist: ${nginxConfig.path}`);
    }

    try {
      await this.writeFile(nginxConfig);
    } catch (error) {
      throw new Error(`Failed to create config file: ${error.message}`);
    }

    nginxConfig.created = true;
    return repository.save(nginxConfig);
  }

  async update(id: number, data: Partial<NginxConfig>): Promise<NginxConfig> {
    const repository = await getRepository(NginxConfig);
    const nginxConfig = await repository.findOne({ where: { id } });

    if (!nginxConfig) {
      throw new NotFoundError("NginxConfig", id);
    }

    const pathChanged = data.path !== undefined && data.path !== nginxConfig.path;
    const nameChanged = data.name !== undefined && data.name !== nginxConfig.name;
    const contentChanged = data.content !== undefined && data.content !== nginxConfig.content;
    const fileNeedsUpdate = pathChanged || nameChanged || contentChanged;

    if (fileNeedsUpdate) {
      const newPath = data.path ?? nginxConfig.path;

      try {
        await fs.access(newPath);
      } catch {
        throw new Error(`Path does not exist: ${newPath}`);
      }

      if (pathChanged || nameChanged) {
        const oldFilePath = path.join(nginxConfig.path, nginxConfig.name);
        try {
          await fs.unlink(oldFilePath);
        } catch (error) {
          throw new Error(`Failed to delete original config file: ${error.message}`);
        }
      }

      Object.assign(nginxConfig, data);

      try {
        await this.writeFile(nginxConfig);
      } catch (error) {
        throw new Error(`Failed to write config file: ${error.message}`);
      }

      if (!nginxConfig.created) {
        nginxConfig.created = true;
      }
    } else {
      Object.assign(nginxConfig, data);
    }

    return repository.save(nginxConfig);
  }

  async delete(id: number): Promise<boolean> {
    const repository = await getRepository(NginxConfig);
    const result = await repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async writeFile(nginxConfig: NginxConfig): Promise<void> {
    const filePath = path.join(nginxConfig.path, nginxConfig.name);
    await fs.writeFile(filePath, nginxConfig.content, "utf-8");
    logger.info(`[NginxConfigService] Written: ${filePath}`);
  }

  async runCommands(nginxConfig: NginxConfig): Promise<{ stdout: string; stderr: string }> {
    const cmds: string[] = JSON.parse(nginxConfig.command);
    if (!Array.isArray(cmds) || cmds.length === 0) {
      throw new Error("command must be a non-empty JSON array of strings");
    }

    const { stdout, stderr } = await execAsync(cmds.join(" && "));

    logger.info(`[NginxConfigService] runCommands ${nginxConfig.name}:`, stdout);
    if (stderr) logger.warning(`[NginxConfigService] stderr:`, stderr);

    return { stdout, stderr };
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
