import { Repository } from "typeorm";
import Project from "../entity/Project";
import Deploy from "../entity/Deploy";
import { DeployService } from "./DeployService";
import { ConfigFileService } from "./ConfigFileService";
import { NotFoundError } from "../errors/AppError";
import { promisify } from "util";
import { exec } from "child_process";
import path from "path";
import { GitHubService } from "./GitHubService";

const execAsync = promisify(exec);

export class ProjectService {
  constructor(
    private readonly projectRepository: Repository<Project>,
    private readonly deployService: DeployService,
    private readonly configFileService: ConfigFileService,
    private readonly githubService: GitHubService,
  ) {}

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      relations: { deploys: true },
    });
  }

  async findById(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: { configFiles: true, deploys: true, slaveServer: true },
    });

    if (!project) {
      throw new NotFoundError("Project", id);
    }

    return project;
  }

  async findByName(name: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { name },
      relations: { configFiles: true, deploys: true, slaveServer: true },
    });
  }

  async findByRepositoryAndBranch(
    repo: string,
    branch: string,
  ): Promise<Project[]> {
    return this.projectRepository.find({
      where: { repository: repo, branch },
      relations: { deploys: true },
    });
  }

  async create(data: Partial<Project>): Promise<Project> {
    const project = this.projectRepository.create(data);
    return this.projectRepository.save(project);
  }

  async updateById(id: number, data: Partial<Project>): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: { configFiles: true, deploys: true, slaveServer: true },
    });

    if (!project) {
      throw new NotFoundError("Project", id);
    }

    Object.assign(project, data);
    return this.projectRepository.save(project);
  }

  async delete(id: number): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: { deploys: true },
    });

    if (!project) {
      return false;
    }

    for (const deploy of project.deploys) {
      await this.deployService.delete(deploy.id);
    }

    const result = await this.projectRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async startDeploys(
    project: Project,
  ): Promise<{ deploy: Deploy; error: Error }[]> {
    const started: Deploy[] = [];
    const errors: { deploy: Deploy; error: Error }[] = [];

    const projectDir = path.join(project.path, this.githubService.getProjectDirectoryName(project.cloneLine));

    await execAsync(`git clone ${project.cloneLine}`, { cwd: project.path });

    await execAsync(`git pull origin ${project.branch}`, { cwd: projectDir });
    await execAsync(`git switch ${project.branch}`, { cwd: projectDir });

    await this.configFileService.writeFiles(project);

    for (const deploy of project.deploys) {
      try {
        await this.deployService.start(projectDir, deploy);
        started.push(deploy);
      } catch (error) {
        errors.push({ deploy, error: error as Error });
      }
    }

    if (errors.length > 0) {
      for (const deploy of started) {
        try {
          await this.deployService.stop(projectDir, deploy);
        } catch {}
      }
    }

    return errors;
  }

  async restartDeploys(
    project: Project,
  ): Promise<{ deploy: Deploy; error: Error }[]> {
    const restarted: Deploy[] = [];
    const errors: { deploy: Deploy; error: Error }[] = [];

    const projectDir = path.join(project.path, this.githubService.getProjectDirectoryName(project.cloneLine));

    await execAsync(`git pull origin ${project.branch}`, { cwd: projectDir });
    await execAsync(`git switch ${project.branch}`, { cwd: projectDir });
    await this.configFileService.writeFiles(project);
    for (const deploy of project.deploys) {
      try {
        await this.deployService.restart(projectDir, deploy);
        restarted.push(deploy);
      } catch (error) {
        errors.push({ deploy, error: error as Error });
      }
    }

    if (errors.length > 0) {
      for (const deploy of restarted) {
        try {
          await this.deployService.stop(projectDir, deploy);
        } catch {}
      }
    }

    return errors;
  }
}
