import * as fs from "fs/promises";
import * as path from "path";
import ConfigFile from "../entity/ConfigFile";
import Deploy from "../entity/Deploy";
import { getRepository } from "../dbConnection";
import { ConfigFileError, NotFoundError } from "../errors/AppError";

export class ConfigFileService {
  async findAll(): Promise<ConfigFile[]> {
    const repository = await getRepository(ConfigFile);
    return repository.find({ relations: { deploy: true } });
  }

  async findById(id: number): Promise<ConfigFile | null> {
    const repository = await getRepository(ConfigFile);
    return repository.findOne({
      where: { id },
      relations: { deploy: true },
    });
  }

  async findByDeploy(deployId: number): Promise<ConfigFile[]> {
    const repository = await getRepository(ConfigFile);
    return repository.find({
      where: { deploy: { id: deployId } },
      relations: { deploy: true },
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

  async writeFiles(deploy: Deploy): Promise<void> {
    const configFiles = await this.findByDeploy(deploy.id);

    if (configFiles.length === 0) {
      return;
    }

    const missingDirectories: string[] = [];

    for (const configFile of configFiles) {
      const dirPath = path.join(deploy.path, configFile.relativePath);

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
      const filePath = path.join(deploy.path, configFile.relativePath, configFile.name);
      await fs.writeFile(filePath, configFile.content, "utf-8");
      console.log(`[ConfigFileService] Written: ${filePath}`);
    }
  }
}
