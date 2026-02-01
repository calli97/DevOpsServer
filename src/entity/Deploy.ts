import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import ConfigFile from "./ConfigFile";

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

  @Column({ type: "text", nullable: true })
  buildCommands: string;

  @Column({ type: "text", nullable: true })
  afterDeployCommands: string;

  @Column({ nullable: false })
  startCommands: string;

  @Column({ nullable: true })
  port: number;

  @Column({ nullable: false, default: false })
  expose: boolean;

  @Column({ nullable: false, default: true })
  active: boolean;

  @Column({ nullable: false, default: false })
  autoUpdate: boolean;

  @OneToMany(() => ConfigFile, (configFile) => configFile.deploy)
  configFiles: ConfigFile[];
}

export default Deploy;
