import { Repository } from "typeorm";
import Project from "../entity/Project";
import { NotFoundError } from "../errors/AppError";

export class ProjectService {
  constructor(private readonly projectRepository: Repository<Project>) {}

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
    const result = await this.projectRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
