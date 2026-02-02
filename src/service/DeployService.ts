import { promisify } from "util";
import { exec } from "child_process";
import Deploy from "../entity/Deploy";
import { getRepository } from "../dbConnection";
import { logger } from "./LogService";

const execAsync = promisify(exec);

export class DeployService {
  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "");
  }

  async findAll(): Promise<Deploy[]> {
    const repository = await getRepository(Deploy);
    return repository.find();
  }

  async findById(id: number): Promise<Deploy | null> {
    const repository = await getRepository(Deploy);
    return repository.findOne({
      where: { id },
      relations: { configFiles: true },
    });
  }

  async findByRepositoryAndBranch(
    repo: string,
    branch: string,
  ): Promise<Deploy[]> {
    const repository = await getRepository(Deploy);
    return repository.find({ where: { repository: repo, branch } });
  }

  async create(data: Partial<Deploy>): Promise<Deploy> {
    const repository = await getRepository(Deploy);
    const deploy = repository.create(data);
    return repository.save(deploy);
  }

  async save(deploy: Deploy): Promise<Deploy> {
    const repository = await getRepository(Deploy);
    return repository.save(deploy);
  }

  async start(deploy: Deploy): Promise<{ stdout: string; stderr: string }> {
    const sanitizedName = this.sanitizeName(deploy.name);
    if (!sanitizedName) {
      throw new Error(`Invalid deploy name: ${deploy.name}`);
    }

    const { stdout, stderr } = await execAsync(
      `pm2 start "${deploy.startCommands}" --name ${sanitizedName}`,
      { cwd: deploy.path },
    );

    logger.info(`[DeployService] PM2 start ${sanitizedName}:`, stdout);
    if (stderr) logger.warning(`[DeployService] stderr:`, stderr);

    return { stdout, stderr };
  }

  async restart(deploy: Deploy): Promise<{ stdout: string; stderr: string }> {
    const sanitizedName = this.sanitizeName(deploy.name);
    if (!sanitizedName) {
      throw new Error(`Invalid deploy name: ${deploy.name}`);
    }

    const { stdout, stderr } = await execAsync(`pm2 restart ${sanitizedName}`, {
      cwd: deploy.path,
    });

    logger.info(`[DeployService] PM2 restart ${sanitizedName}:`, stdout);
    if (stderr) logger.warning(`[DeployService] stderr:`, stderr);

    return { stdout, stderr };
  }

  async stop(deploy: Deploy): Promise<{ stdout: string; stderr: string }> {
    const sanitizedName = this.sanitizeName(deploy.name);
    if (!sanitizedName) {
      throw new Error(`Invalid deploy name: ${deploy.name}`);
    }

    const { stdout, stderr } = await execAsync(`pm2 stop ${sanitizedName}`, {
      cwd: deploy.path,
    });

    logger.info(`[DeployService] PM2 stop ${sanitizedName}:`, stdout);
    if (stderr) logger.warning(`[DeployService] stderr:`, stderr);

    return { stdout, stderr };
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

  async update(deploy: Deploy): Promise<void> {
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
