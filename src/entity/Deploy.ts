import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { getRepository } from "../dbConnection";

@Entity()
class Deploy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  path: string;

  @Column({ nullable: false })
  repository: string;

  @Column({ nullable: false })
  branch: string;

  @Column({ nullable: true })
  buildCommands: string;

  @Column({ nullable: false })
  startCommands: string;

  @Column({ nullable: true })
  port: number;

  @Column({ nullable: false, default: false })
  expose: boolean;

  @Column({ nullable: false, default: true })
  active: boolean;

  static async storeNewDeploy(
    name: string,
    path: string,
    gitRepository: string,
    branch: string,
    expose: boolean,
    active: true,
    buildCommands: string,
    startCommands: string,
    port: number
  ) {
    const repository = getRepository(Deploy);

    const newDeploy = new Deploy();
    newDeploy.name = name;
    newDeploy.path = path;
    (newDeploy.repository = gitRepository), (newDeploy.branch = branch);
    newDeploy.expose = expose;
    newDeploy.active = active;
    newDeploy.buildCommands = buildCommands;
    newDeploy.startCommands = startCommands;
    newDeploy.port = port;
    return await repository.save(newDeploy);
  }
}

export default Deploy;
