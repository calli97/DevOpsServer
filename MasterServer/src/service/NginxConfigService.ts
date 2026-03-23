import * as fs from "fs/promises";
import * as path from "path";
import NginxConfig from "../entity/NginxConfig";
import { getRepository } from "../dbConnection";
import { NotFoundError } from "../errors/AppError";
import { logger } from "./LogService";

export class NginxConfigService {
  async findByProjectInstance(instanceId: number): Promise<NginxConfig[]> {
    const repository = await getRepository(NginxConfig);
    return repository.find({
      where: { projectInstance: { id: instanceId } },
      relations: { projectInstance: true },
    });
  }

  async create(data: Partial<NginxConfig>): Promise<NginxConfig> {
    const repository = await getRepository(NginxConfig);
    const nginxConfig = repository.create(data);
    return repository.save(nginxConfig);
  }

  async update(id: number, data: Partial<NginxConfig>): Promise<NginxConfig> {
    const repository = await getRepository(NginxConfig);
    const nginxConfig = await repository.findOne({ where: { id } });

    if (!nginxConfig) {
      throw new NotFoundError("NginxConfig", id);
    }

    Object.assign(nginxConfig, data);
    return repository.save(nginxConfig);
  }

  async delete(id: number): Promise<boolean> {
    const repository = await getRepository(NginxConfig);
    const result = await repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async writeFile(nginxConfig: NginxConfig): Promise<void> {
    const filePath = path.join(nginxConfig.path, nginxConfig.name);
    await fs.writeFile(filePath, nginxConfig.content, "utf-8");
    logger.info(`[NginxConfigService] Written: ${filePath}`);
  }
}
