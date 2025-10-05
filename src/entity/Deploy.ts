import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { dataSource, getRepository } from "../dbConnection";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

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
    const repository = await getRepository(Deploy);

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

  async runStartCmd() {
    const { stdout, stderr } = await execAsync(this.startCommands, {
      cwd: this.path,
    });
  }

  async runBuildCmds() {
    const cmds: Array<string> = JSON.parse(this.buildCommands);
    for (let i = 0; i < cmds.length; i++) {
      const { stdout, stderr } = await execAsync(cmds[i], {
        cwd: this.path,
      });
    }
  }
}

export default Deploy;
