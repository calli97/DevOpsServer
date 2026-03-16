import { Repository } from "typeorm";
import Project from "../entity/Project";
import { NotFoundError } from "../errors/AppError";

export class ProjectService {
  constructor(
    private readonly projectRepository: Repository<Project>,
  ) {}

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      relations: {
        instances: {
          deploys: true,
          configFiles: true,
          slaveServer: true,
        },
      },
    });
  }

  async findById(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: {
        instances: {
          deploys: true,
          configFiles: true,
          slaveServer: true,
        },
      },
    });

    if (!project) {
      throw new NotFoundError("Project", id);
    }

    return project;
  }

  async findByName(name: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { name },
      relations: {
        instances: {
          deploys: true,
          configFiles: true,
          slaveServer: true,
        },
      },
    });
  }

  async findByRepositoryAndBranch(
    repo: string,
    branch: string,
  ): Promise<Project[]> {
    return this.projectRepository.find({
      where: {
        repository: repo,
        instances: { branch },
      },
      relations: {
        instances: {
          deploys: true,
          configFiles: true,
          slaveServer: true,
        },
      },
    });
  }

  async create(data: Partial<Project>): Promise<Project> {
    const project = this.projectRepository.create(data);
    return this.projectRepository.save(project);
  }

  async updateById(id: number, data: Partial<Project>): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } });

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
