import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import NginxConfig from "../entity/NginxConfig";
import { getRepository } from "../dbConnection";
import { NotFoundError } from "../errors/AppError";
import { logger } from "./LogService";
import { SlaveServerClient } from "./SlaveServerClient";
import { SlaveServerService } from "./SlaveServerService";

const execAsync = promisify(exec);

export class NginxConfigService {
  constructor(
    private slaveClient = new SlaveServerClient(),
    private slaveServerService = new SlaveServerService(),
  ) {}
  async findById(id: number): Promise<NginxConfig | null> {
    const repository = await getRepository(NginxConfig);
    return repository.findOne({ where: { id } });
  }

  async findByIdWithRelations(id: number): Promise<NginxConfig | null> {
    const repository = await getRepository(NginxConfig);
    return repository.findOne({
      where: { id },
      relations: ["projectInstance", "projectInstance.slaveServer"],
    });
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

    const full = await this.findByIdWithRelations(nginxConfig.id);
    const slave = full?.projectInstance?.slaveServer ?? null;

    if (slave) {
      const result = await this.slaveClient.writeNginxConfig(
        slave, nginxConfig.path, nginxConfig.name, nginxConfig.content,
      );
      if (!result.ok) throw new Error(result.error ?? "Failed to write nginx config on slave");
    } else {
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
    }

    nginxConfig.created = true;
    return repository.save(nginxConfig);
  }

  async update(id: number, data: Partial<NginxConfig>): Promise<NginxConfig> {
    const nginxConfig = await this.findByIdWithRelations(id);

    if (!nginxConfig) {
      throw new NotFoundError("NginxConfig", id);
    }

    const slave = nginxConfig.projectInstance?.slaveServer ?? null;

    const pathChanged = data.path !== undefined && data.path !== nginxConfig.path;
    const nameChanged = data.name !== undefined && data.name !== nginxConfig.name;
    const contentChanged = data.content !== undefined && data.content !== nginxConfig.content;
    const fileNeedsUpdate = pathChanged || nameChanged || contentChanged;

    if (fileNeedsUpdate) {
      if (slave) {
        const oldPath = nginxConfig.path;
        const oldName = nginxConfig.name;
        Object.assign(nginxConfig, data);

        if (pathChanged || nameChanged) {
          await this.slaveClient.deleteNginxFile(slave, oldPath, oldName);
        }

        const result = await this.slaveClient.writeNginxConfig(
          slave, nginxConfig.path, nginxConfig.name, nginxConfig.content,
        );
        if (!result.ok) throw new Error(result.error ?? "Failed to write nginx config on slave");
      } else {
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
      }

      if (!nginxConfig.created) {
        nginxConfig.created = true;
      }
    } else {
      Object.assign(nginxConfig, data);
    }

    const repository = await getRepository(NginxConfig);
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
    const full = await this.findByIdWithRelations(nginxConfig.id);
    const slave = full?.projectInstance?.slaveServer ?? null;

    if (slave) {
      const result = await this.slaveClient.runNginxCommands(slave, nginxConfig.command);
      if (!result.ok) throw new Error(result.error ?? "Failed to run commands on slave");
      return { stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
    }

    const cmds: string[] = JSON.parse(nginxConfig.command);
    if (!Array.isArray(cmds) || cmds.length === 0) {
      throw new Error("command must be a non-empty JSON array of strings");
    }

    const { stdout, stderr } = await execAsync(cmds.join(" && "));

    logger.info(`[NginxConfigService] runCommands ${nginxConfig.name}:`, stdout);
    if (stderr) logger.warning(`[NginxConfigService] stderr:`, stderr);

    return { stdout, stderr };
  }

  async testConfig(target: "master" | number): Promise<{ ok: boolean; stdout: string; stderr: string }> {
    if (target !== "master") {
      const slave = await this.slaveServerService.findById(target);
      const result = await this.slaveClient.testConfig(slave);
      return { ok: result.ok, stdout: result.stdout ?? "", stderr: result.stderr ?? (result.error ?? "") };
    }
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

  async reload(target: "master" | number): Promise<{ ok: boolean; stdout: string; stderr: string }> {
    if (target !== "master") {
      const slave = await this.slaveServerService.findById(target);
      const result = await this.slaveClient.reload(slave);
      return { ok: result.ok, stdout: result.stdout ?? "", stderr: result.stderr ?? (result.error ?? "") };
    }
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

  async syncStatus(id: number): Promise<{ ok: boolean; inSync: boolean; error?: string }> {
    const nginxConfig = await this.findByIdWithRelations(id);
    if (!nginxConfig) {
      return { ok: false, inSync: false, error: `NginxConfig ${id} not found` };
    }

    const slave = nginxConfig.projectInstance?.slaveServer ?? null;

    try {
      let diskContent: string;

      if (slave) {
        const result = await this.slaveClient.readNginxConfig(slave, nginxConfig.path, nginxConfig.name);
        if (!result.ok || result.content === undefined) {
          return { ok: false, inSync: false, error: result.error ?? "Failed to read file from slave" };
        }
        diskContent = result.content;
      } else {
        const filePath = path.join(nginxConfig.path, nginxConfig.name);
        diskContent = await fs.readFile(filePath, "utf-8");
      }

      return { ok: true, inSync: diskContent === nginxConfig.content };
    } catch (error) {
      return { ok: false, inSync: false, error: error.message };
    }
  }

  async forceSync(id: number, source: "stored" | "current"): Promise<{ ok: boolean; error?: string }> {
    const nginxConfig = await this.findByIdWithRelations(id);
    if (!nginxConfig) {
      return { ok: false, error: `NginxConfig ${id} not found` };
    }

    const slave = nginxConfig.projectInstance?.slaveServer ?? null;

    try {
      if (source === "stored") {
        if (slave) {
          return this.slaveClient.writeNginxConfig(slave, nginxConfig.path, nginxConfig.name, nginxConfig.content);
        }
        await this.writeFile(nginxConfig);
        return { ok: true };
      } else {
        let diskContent: string;

        if (slave) {
          const result = await this.slaveClient.readNginxConfig(slave, nginxConfig.path, nginxConfig.name);
          if (!result.ok || result.content === undefined) {
            return { ok: false, error: result.error ?? "Failed to read file from slave" };
          }
          diskContent = result.content;
        } else {
          const filePath = path.join(nginxConfig.path, nginxConfig.name);
          diskContent = await fs.readFile(filePath, "utf-8");
        }

        const repository = await getRepository(NginxConfig);
        await repository.update(id, { content: diskContent });
        return { ok: true };
      }
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}
