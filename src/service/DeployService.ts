import { promisify } from "util";
import { exec } from "child_process";
import { Repository } from "typeorm";
import Deploy from "../entity/Deploy";
import PM2Service from "./PM2Service";
import { logger } from "./LogService";

const execAsync = promisify(exec);

export class DeployService {
  constructor(
    private readonly deployRepository: Repository<Deploy>,
    private readonly pm2Service: PM2Service,
  ) {}

  async findAll(): Promise<Deploy[]> {
    return this.deployRepository.find();
  }

  async findById(id: number): Promise<Deploy | null> {
    return this.deployRepository.findOne({
      where: { id },
      relations: { project: true },
    });
  }

  async findByRepositoryAndBranch(
    repo: string,
    branch: string,
  ): Promise<Deploy[]> {
    return this.deployRepository.find({
      where: { project: { repository: repo, branch } },
      relations: { project: true },
    });
  }

  async create(data: Partial<Deploy>): Promise<Deploy> {
    const deploy = this.deployRepository.create(data);
    return this.deployRepository.save(deploy);
  }

  async save(deploy: Deploy): Promise<Deploy> {
    return this.deployRepository.save(deploy);
  }

  async updateById(id: number, data: Partial<Deploy>): Promise<Deploy | null> {
    const deploy = await this.deployRepository.findOne({ where: { id } });

    if (!deploy) {
      return null;
    }

    Object.assign(deploy, data);
    return this.deployRepository.save(deploy);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.deployRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async runBuildCommands(
    deploy: Deploy,
  ): Promise<{ stdout: string; stderr: string }> {
    if (!deploy.buildCommands) {
      return { stdout: "", stderr: "" };
    }

    const cmds: string[] = JSON.parse(deploy.buildCommands);
    if (!Array.isArray(cmds) || cmds.length === 0) {
      throw new Error("buildCommands must be a non-empty array");
    }

    const { stdout, stderr } = await execAsync(cmds.join(" && "), {
      cwd: deploy.path,
    });

    logger.info(`[DeployService] Build ${deploy.name}:`, stdout);
    if (stderr) logger.warning(`[DeployService] stderr:`, stderr);

    return { stdout, stderr };
  }

  async runDeploy(deploy: Deploy): Promise<void> {
    logger.info(`[DeployService] Updating ${deploy.name}...`);

    // Git pull
    await execAsync(`git pull origin ${deploy.branch}`, { cwd: deploy.path });

    // Build
    if (deploy.buildCommands) {
      await this.runBuildCommands(deploy);
    }

    // Restart
    await this.restart(deploy);

    logger.success(`[DeployService] Update completed for ${deploy.name}`);
  }

  async syncStatus(deploy: Deploy): Promise<boolean> {
    try {
      const sanitizedName = this.sanitizeName(deploy.name);
      const { stdout } = await execAsync("pm2 jlist");

      if (!stdout || stdout.trim().length === 0) {
        if (deploy.active !== false) {
          deploy.active = false;
          await this.save(deploy);
        }
        return false;
      }

      const processes = JSON.parse(stdout);
      const process = processes.find((p: any) => p.name === sanitizedName);
      const isRunning = process?.pm2_env?.status === "online";

      if (deploy.active !== isRunning) {
        deploy.active = isRunning;
        await this.save(deploy);
      }

      return isRunning;
    } catch (error) {
      if (deploy.active !== false) {
        deploy.active = false;
        await this.save(deploy);
      }
      return false;
    }
  }

  async listWithStatus(): Promise<
    Array<{ deploy: Deploy; isRunning: boolean }>
  > {
    const deploys = await this.findAll();

    return Promise.all(
      deploys.map(async (deploy) => {
        const isRunning = await this.syncStatus(deploy);
        return { deploy, isRunning };
      }),
    );
  }
}
