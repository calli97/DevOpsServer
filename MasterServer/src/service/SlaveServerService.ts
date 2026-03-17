import SlaveServer from "../entity/SlaveServer";
import { getRepository } from "../dbConnection";
import { NotFoundError } from "../errors/AppError";

export class SlaveServerService {
  async findAll(): Promise<SlaveServer[]> {
    const repository = await getRepository(SlaveServer);
    return repository.find({ relations: { instances: true } });
  }

  async findById(id: number): Promise<SlaveServer> {
    const repository = await getRepository(SlaveServer);
    const slaveServer = await repository.findOne({
      where: { id },
      relations: { instances: true },
    });

    if (!slaveServer) {
      throw new NotFoundError("SlaveServer", id);
    }

    return slaveServer;
  }

  async create(data: Partial<SlaveServer>): Promise<SlaveServer> {
    const repository = await getRepository(SlaveServer);
    const slaveServer = repository.create(data);
    return repository.save(slaveServer);
  }

  async updateById(
    id: number,
    data: Partial<SlaveServer>,
  ): Promise<SlaveServer> {
    const repository = await getRepository(SlaveServer);
    const slaveServer = await repository.findOne({ where: { id } });

    if (!slaveServer) {
      throw new NotFoundError("SlaveServer", id);
    }

    Object.assign(slaveServer, data);
    return repository.save(slaveServer);
  }

  async delete(id: number): Promise<boolean> {
    const repository = await getRepository(SlaveServer);
    const result = await repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
