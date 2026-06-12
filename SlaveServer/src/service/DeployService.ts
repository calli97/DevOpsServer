import { promisify } from "util";
import { exec } from "child_process";
import path from "path";
import { DeployDto, DeployLogDto, DeployOpResultDto } from "../dto/slave.dto";
import PM2Service from "./PM2Service";
import { logger } from "./LogService";

const execAsync = promisify(exec);

export class DeployService {
  constructor(private readonly pm2Service: PM2Service) {}

  private async runBuildCommands(
    projectPath: string,
    deploy: DeployDto,
  ): Promise<{ stdout: string; stderr: string }> {
    if (!deploy.buildCommands) {
      return { stdout: "", stderr: "" };
    }

    const cmds: string[] = JSON.parse(deploy.buildCommands);
    if (!Array.isArray(cmds) || cmds.length === 0) {
      throw new Error("buildCommands must be a non-empty array");
    }

    const { stdout, stderr } = await execAsync(cmds.join(" && "), {
      cwd: path.join(projectPath, deploy.startPath),
    });

    logger.info(`[DeployService] Build ${deploy.name}:`, stdout);
    if (stderr) logger.warning(`[DeployService] stderr:`, stderr);

    return { stdout, stderr };
  }

  private async runPostStartCommands(
    projectPath: string,
    deploy: DeployDto,
  ): Promise<{ stdout: string; stderr: string }> {
    if (!deploy.postStartCommands) {
      return { stdout: "", stderr: "" };
    }

    const cmds: string[] = JSON.parse(deploy.postStartCommands);
    if (!Array.isArray(cmds) || cmds.length === 0) {
      throw new Error("postStartCommands must be a non-empty array");
    }

    const { stdout, stderr } = await execAsync(cmds.join(" && "), {
      cwd: path.join(projectPath, deploy.startPath),
    });

    logger.info(`[DeployService] PostStart ${deploy.name}:`, stdout);
    if (stderr) logger.warning(`[DeployService] PostStart stderr:`, stderr);

    return { stdout, stderr };
  }

  async start(
    projectPath: string,
    deploy: DeployDto,
  ): Promise<DeployOpResultDto> {
    const build = await this.runBuildCommands(projectPath, deploy);

    logger.success(`[DeployService] Build completed for deploy ${deploy.name}`);

    if (deploy.isStaticSite) {
      const postStart = await this.runPostStartCommands(projectPath, deploy);
      return { build, postStart };
    }

    const start = await this.pm2Service.start(
      deploy.name,
      deploy.startCommands,
      path.join(projectPath, deploy.startPath),
    );
    const postStart = await this.runPostStartCommands(projectPath, deploy);
    return { build, start, postStart };
  }

  async restart(
    projectPath: string,
    deploy: DeployDto,
  ): Promise<DeployOpResultDto> {
    const build = await this.runBuildCommands(projectPath, deploy);

    if (deploy.isStaticSite) {
      const postStart = await this.runPostStartCommands(projectPath, deploy);
      return { build, postStart };
    }

    const restart = await this.pm2Service.restart(
      deploy.name,
      path.join(projectPath, deploy.startPath),
    );
    const postStart = await this.runPostStartCommands(projectPath, deploy);
    return { build, restart, postStart };
  }

  async stop(
    projectPath: string,
    deploy: DeployDto,
  ): Promise<{ stop: DeployLogDto }> {
    const stop = await this.pm2Service.stop(
      deploy.name,
      path.join(projectPath, deploy.startPath),
    );
    return { stop };
  }
}
