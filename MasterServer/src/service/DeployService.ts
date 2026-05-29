import { promisify } from "util";
import { exec } from "child_process";
import { Repository } from "typeorm";
import Deploy from "../entity/Deploy";
import NginxConfig from "../entity/NginxConfig";
import PM2Service from "./PM2Service";
import { GitHubService } from "./GitHubService";
import { ConfigFileService } from "./ConfigFileService";
import { SlaveServerClient } from "./SlaveServerClient";
import { logger } from "./LogService";
import { getRepository } from "../dbConnection";
import path from "path";

const execAsync = promisify(exec);

export class DeployService {
  constructor(
    private readonly deployRepository: Repository<Deploy>,
    private readonly pm2Service: PM2Service,
    private readonly githubService: GitHubService,
    private readonly configFileService: ConfigFileService,
    private readonly slaveServerClient: SlaveServerClient,
  ) {}

  async findAll(): Promise<Deploy[]> {
    return this.deployRepository.find();
  }

  async findById(id: number): Promise<Deploy | null> {
    return this.deployRepository.findOne({
      where: { id },
      relations: { projectInstance: { project: true } },
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
    const deploy = await this.deployRepository.findOne({ where: { id } });
    if (!deploy) {
      return false;
    }
    await this.pm2Service.delete(deploy.name);
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
      cwd: path.join(projectPath, deploy.startPath),
    });

    logger.info(`[DeployService] Build ${deploy.name}:`, stdout);
    if (stderr) logger.warning(`[DeployService] stderr:`, stderr);

    return { stdout, stderr };
  }

  private async gitPull(
    projectPath: string,
    branch: string,
  ): Promise<void> {
    await execAsync(`git pull origin ${branch}`, { cwd: projectPath });
    await execAsync(`git switch ${branch}`, { cwd: projectPath });
  }

  async start(
    projectPath: string,
    deploy: Deploy,
  ): Promise<{ stdout: string; stderr: string }> {
    const projectInstance = await this.resolveProjectInstance(deploy);
    if (projectInstance) {
      await this.gitPull(projectPath, projectInstance.branch);
      await this.configFileService.writeFilesForInstance(projectInstance, projectPath);
    }
    let buildResponse = await this.runBuildCommands(projectPath, deploy);
    if (buildResponse.stderr && buildResponse.stderr != "") {
      return buildResponse;
    }
    logger.success(
      `[DeployService] Build completed for deploy ${deploy.name} [ID: ${deploy.id}]`,
    );
    if (deploy.isStaticSite) {
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
    const projectInstance = await this.resolveProjectInstance(deploy);
    if (projectInstance) {
      await this.gitPull(projectPath, projectInstance.branch);
      await this.configFileService.writeFilesForInstance(projectInstance, projectPath);
    }
    let buildResponse = await this.runBuildCommands(projectPath, deploy);
    if (buildResponse.stderr && buildResponse.stderr != "") {
      return buildResponse;
    }
    if (deploy.isStaticSite) {
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

  private async resolveProjectInstance(deploy: Deploy) {
    if (deploy.projectInstance) {
      return deploy.projectInstance;
    }
    const full = await this.deployRepository.findOne({
      where: { id: deploy.id },
      relations: { projectInstance: true },
    });
    return full?.projectInstance ?? null;
  }

  private getInstanceDir(deploy: Deploy): string {
    const repoDir = this.githubService.getProjectDirectoryName(
      deploy.projectInstance.project.cloneLine,
    );
    return path.join(deploy.projectInstance.path, repoDir);
  }

  async startOrRestart(id: number): Promise<Deploy> {
    const deploy = await this.deployRepository.findOne({
      where: { id },
      relations: {
        projectInstance: {
          project: true,
          slaveServer: true,
          configFiles: true,
        },
      },
    });

    if (!deploy) {
      return null;
    }

    if (deploy.projectInstance.slaveServer) {
      const nginxConfigRepository = await getRepository(NginxConfig);
      const nginxConfigs = await nginxConfigRepository.find({
        where: { projectInstance: { id: deploy.projectInstance.id } },
      });

      const response = await this.slaveServerClient.deploy(deploy.projectInstance.slaveServer, {
        instancePath: deploy.projectInstance.path,
        branch: deploy.projectInstance.branch,
        cloneLine: deploy.projectInstance.project.cloneLine,
        deploys: [{
          name: deploy.name,
          startPath: deploy.startPath,
          buildCommands: deploy.buildCommands ?? null,
          startCommands: deploy.startCommands,
          started: deploy.started,
          isStaticSite: deploy.isStaticSite,
        }],
        configFiles: (deploy.projectInstance.configFiles ?? []).map((cf) => ({
          name: cf.name,
          relativePath: cf.relativePath,
          content: cf.content,
        })),
        nginxConfigs: nginxConfigs.map((nc) => ({
          name: nc.name,
          path: nc.path,
          content: nc.content,
          command: nc.command,
        })),
      });

      const deployError = response.errors.find((e) => e.deployName === deploy.name);
      if (deployError) throw new Error(deployError.error);

      deploy.started = true;
      return this.deployRepository.save(deploy);
    }

    const instanceDir = this.getInstanceDir(deploy);
    let result: { stdout: string; stderr: string };

    if (!deploy.started) {
      result = await this.start(instanceDir, deploy);
    } else {
      result = await this.restart(instanceDir, deploy);
    }

    if (result.stderr) {
      throw new Error(result.stderr);
    }

    deploy.started = true;
    return this.deployRepository.save(deploy);
  }

  async stopById(id: number): Promise<Deploy | null> {
    const deploy = await this.deployRepository.findOne({
      where: { id },
      relations: {
        projectInstance: {
          project: true,
          slaveServer: true,
        },
      },
    });

    if (!deploy) {
      return null;
    }

    if (deploy.projectInstance.slaveServer) {
      await this.slaveServerClient.stop(deploy.projectInstance.slaveServer, {
        instancePath: deploy.projectInstance.path,
        cloneLine: deploy.projectInstance.project.cloneLine,
        deployName: deploy.name,
        startPath: deploy.startPath,
      });
      return deploy;
    }

    const instanceDir = this.getInstanceDir(deploy);
    await this.stop(instanceDir, deploy);
    return deploy;
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
