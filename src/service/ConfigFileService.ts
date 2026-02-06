import * as fs from "fs/promises";
import * as path from "path";
import ConfigFile from "../entity/ConfigFile";
import Project from "../entity/Project";
import { getRepository } from "../dbConnection";
import { ConfigFileError, NotFoundError } from "../errors/AppError";
import { logger } from "./LogService";

export class ConfigFileService {
  async findAll(): Promise<ConfigFile[]> {
    const repository = await getRepository(ConfigFile);
    return repository.find({ relations: { project: true } });
  }

  async findById(id: number): Promise<ConfigFile | null> {
    const repository = await getRepository(ConfigFile);
    return repository.findOne({
      where: { id },
      relations: { project: true },
    });
  }

  async findByProject(projectId: number): Promise<ConfigFile[]> {
    const repository = await getRepository(ConfigFile);
    return repository.find({
      where: { project: { id: projectId } },
      relations: { project: true },
    });
  }

  async create(data: Partial<ConfigFile>): Promise<ConfigFile> {
    const repository = await getRepository(ConfigFile);
    const configFile = repository.create(data);
    return repository.save(configFile);
  }

  async update(id: number, data: Partial<ConfigFile>): Promise<ConfigFile> {
    const repository = await getRepository(ConfigFile);
    const configFile = await repository.findOne({ where: { id } });

    if (!configFile) {
      throw new NotFoundError("ConfigFile", id);
    }

    Object.assign(configFile, data);
    return repository.save(configFile);
  }

  async delete(id: number): Promise<boolean> {
    const repository = await getRepository(ConfigFile);
    const result = await repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async writeFiles(project: Project): Promise<void> {
    const configFiles = await this.findByProject(project.id);

    if (configFiles.length === 0) {
      return;
    }

    const missingDirectories: string[] = [];

    for (const configFile of configFiles) {
      const dirPath = path.join(project.path, configFile.relativePath);

      try {
        const stat = await fs.stat(dirPath);
        if (!stat.isDirectory()) {
          missingDirectories.push(dirPath);
        }
      } catch {
        missingDirectories.push(dirPath);
      }
    }

    if (missingDirectories.length > 0) {
      throw new ConfigFileError(
        `Cannot write config files: missing directories`,
        { missingDirectories },
      );
    }

    for (const configFile of configFiles) {
      const filePath = path.join(project.path, configFile.relativePath, configFile.name);
      await fs.writeFile(filePath, configFile.content, "utf-8");
      logger.info(`[ConfigFileService] Written: ${filePath}`);
    }
  }
}
