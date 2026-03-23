import NginxConfig from "../entity/NginxConfig";
import { getRepository } from "../dbConnection";
import { NotFoundError } from "../errors/AppError";

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
}
