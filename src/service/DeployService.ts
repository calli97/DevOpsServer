import { promisify } from "util";
import { exec } from "child_process";
import { Repository } from "typeorm";
import Deploy from "../entity/Deploy";
import PM2Service from "./PM2Service";
import { logger } from "./LogService";
import path from "path";

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

  private async runBuildCommands(
    projectPath: string,
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
      cwd: path.join(projectPath),
    });

    logger.info(`[DeployService] Build ${deploy.name}:`, stdout);
    if (stderr) logger.warning(`[DeployService] stderr:`, stderr);

    return { stdout, stderr };
  }

  async start(
    projectPath: string,
    deploy: Deploy,
  ): Promise<{ stdout: string; stderr: string }> {
    let buildResponse = await this.runBuildCommands(projectPath, deploy);
    if (buildResponse.stderr && buildResponse.stderr != "") {
      return buildResponse;
    }
    return await this.pm2Service.start(
      deploy.name,
      deploy.startCommands,
      path.join(projectPath, deploy.startPath),
    );
  }

  async restart(
    projectPath: string,
    deploy: Deploy,
  ): Promise<{ stdout: string; stderr: string }> {
    let buildResponse = await this.runBuildCommands(projectPath, deploy);
    if (buildResponse.stderr && buildResponse.stderr != "") {
      return buildResponse;
    }
    return await this.pm2Service.restart(
      deploy.name,
      path.join(projectPath, deploy.startPath),
    );
  }

  async stop(
    projectPath: string,
    deploy: Deploy,
  ): Promise<{ stdout: string; stderr: string }> {
    return await this.pm2Service.stop(
      deploy.name,
      path.join(projectPath, deploy.startPath),
    );
  }

  // async runDeploy(deploy: Deploy): Promise<void> {
  //   logger.info(`[DeployService] Updating ${deploy.name}...`);

  //   // Git pull
  //   await execAsync(`git pull origin ${deploy.branch}`, { cwd: deploy.path });

  //   // Build
  //   if (deploy.buildCommands) {
  //     await this.runBuildCommands(deploy);
  //   }

  //   // Restart
  //   await this.restart(deploy);

  //   logger.success(`[DeployService] Update completed for ${deploy.name}`);
  // }
}
