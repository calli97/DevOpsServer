import { promisify } from "util";
import { exec } from "child_process";
import path from "path";
import ProjectInstance from "../entity/ProjectInstance";
import NginxConfig from "../entity/NginxConfig";
import Deploy from "../entity/Deploy";
import { getRepository } from "../dbConnection";
import { NotFoundError } from "../errors/AppError";
import { DeployService } from "./DeployService";
import { ConfigFileService } from "./ConfigFileService";
import { GitHubService } from "./GitHubService";
import { SlaveServerClient } from "./SlaveServerClient";
import { logger } from "./LogService";

const execAsync = promisify(exec);

export class ProjectInstanceService {
  constructor(
    private readonly deployService: DeployService,
    private readonly configFileService: ConfigFileService,
    private readonly githubService: GitHubService,
    private readonly slaveServerClient: SlaveServerClient,
  ) {}

  async findAll(): Promise<ProjectInstance[]> {
    const repository = await getRepository(ProjectInstance);
    return repository.find({
      relations: {
        project: true,
        slaveServer: true,
        configFiles: true,
        deploys: true,
      },
    });
  }

  async findById(id: number): Promise<ProjectInstance> {
    const repository = await getRepository(ProjectInstance);
    const instance = await repository.findOne({
      where: { id },
      relations: {
        project: true,
        slaveServer: true,
        configFiles: true,
        deploys: true,
      },
    });

    if (!instance) {
      throw new NotFoundError("ProjectInstance", id);
    }

    return instance;
  }

  async findByProjectId(projectId: number): Promise<ProjectInstance[]> {
    const repository = await getRepository(ProjectInstance);
    return repository.find({
      where: { project: { id: projectId } },
      relations: {
        project: true,
        slaveServer: true,
        configFiles: true,
        deploys: true,
      },
    });
  }

  private async tryClone(instance: ProjectInstance): Promise<ProjectInstance> {
    const repository = await getRepository(ProjectInstance);
    const full = await repository.findOne({
      where: { id: instance.id },
      relations: { project: true, slaveServer: true },
    });

    if (!full) {
      throw new NotFoundError("ProjectInstance", instance.id);
    }

    if (full.slaveServer) {
      try {
        logger.info(`[ProjectInstanceService] Delegating clone to slave server ${full.slaveServer.nombre}`);
        const response = await this.slaveServerClient.clone(
          full.slaveServer,
          full.project.cloneLine,
          full.path,
        );
        full.cloned = response.cloned;
        return repository.save(full);
      } catch (error) {
        logger.warning(
          `[ProjectInstanceService] Failed to clone on slave server for instance ${full.id}:`,
          error,
        );
        return full;
      }
    }

    try {
      await execAsync(`git clone ${full.project.cloneLine}`, {
        cwd: full.path,
      });
      full.cloned = true;
      return repository.save(full);
    } catch (error) {
      logger.warning(
        `[ProjectInstanceService] Failed to clone repo for instance ${full.id}:`,
        error,
      );
      return full;
    }
  }

  async create(data: Partial<ProjectInstance>): Promise<ProjectInstance> {
    const repository = await getRepository(ProjectInstance);
    const instance = repository.create(data);
    const saved = await repository.save(instance);
    return this.tryClone(saved);
  }

  async updateById(
    id: number,
    data: Partial<ProjectInstance>,
  ): Promise<ProjectInstance> {
    const repository = await getRepository(ProjectInstance);
    const instance = await repository.findOne({ where: { id } });

    if (!instance) {
      throw new NotFoundError("ProjectInstance", id);
    }

    Object.assign(instance, data);
    const saved = await repository.save(instance);

    if (!saved.cloned) {
      return this.tryClone(saved);
    }

    return saved;
  }

  async delete(id: number): Promise<boolean> {
    const repository = await getRepository(ProjectInstance);
    const result = await repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async startOrRestartDeploys(
    instance: ProjectInstance,
  ): Promise<{ deploy: Deploy; error: Error }[]> {
    const succeeded: Deploy[] = [];
    const errors: { deploy: Deploy; error: Error }[] = [];

    if (!instance.project || !instance.deploys) {
      const repository = await getRepository(ProjectInstance);
      const full = await repository.findOne({
        where: { id: instance.id },
        relations: {
          project: true,
          slaveServer: true,
          configFiles: true,
          deploys: true,
          nginxConfigs: true,
        },
      });
      if (!full?.project) {
        throw new Error(`ProjectInstance ${instance.id} has no associated project`);
      }
      instance = full;
    }

    if (instance.slaveServer) {
      const nginxConfigRepository = await getRepository(NginxConfig);
      const nginxConfigs = await nginxConfigRepository.find({
        where: { projectInstance: { id: instance.id } },
      });

      logger.info(`[ProjectInstanceService] Delegating deploy to slave server ${instance.slaveServer.nombre}`);

      const response = await this.slaveServerClient.deploy(instance.slaveServer, {
        instancePath: instance.path,
        branch: instance.branch,
        cloneLine: instance.project.cloneLine,
        deploys: instance.deploys.map((d) => ({
          name: d.name,
          startPath: d.startPath,
          buildCommands: d.buildCommands ?? null,
          startCommands: d.startCommands,
          started: d.started,
          isStaticSite: d.isStaticSite,
        })),
        configFiles: (instance.configFiles ?? []).map((cf) => ({
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

      return response.errors.map((e) => ({
        deploy: instance.deploys.find((d) => d.name === e.deployName) ?? instance.deploys[0],
        error: new Error(e.error),
      }));
    }

    const instanceDir = path.join(
      instance.path,
      this.githubService.getProjectDirectoryName(instance.project.cloneLine),
    );
    console.log("INSTANCE DIR:", instanceDir);

    await execAsync(`git pull origin ${instance.branch}`, { cwd: instanceDir });
    await execAsync(`git switch ${instance.branch}`, { cwd: instanceDir });

    await this.configFileService.writeFilesForInstance(instance, instanceDir);

    for (const deploy of instance.deploys) {
      try {
        const result = deploy.started
          ? await this.deployService.restart(instanceDir, deploy)
          : await this.deployService.start(instanceDir, deploy);
        if (result.stderr) {
          errors.push({ deploy, error: new Error(result.stderr) });
        } else {
          succeeded.push(deploy);
        }
      } catch (error) {
        errors.push({ deploy, error: error as Error });
      }
    }

    if (errors.length > 0) {
      for (const deploy of succeeded) {
        try {
          await this.deployService.stop(instanceDir, deploy);
        } catch {}
      }
    }

    return errors;
  }
  async getByRepositoryNameAndBranch(repositoryName: string, branch: string) {
    const repository = await getRepository(ProjectInstance);
    const instances = await repository.find({
      where: {
        branch: branch,
        project: {
          name: repositoryName,
        },
      },
    });
    return instances;
  }
}
