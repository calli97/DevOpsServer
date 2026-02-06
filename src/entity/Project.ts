import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import ConfigFile from "./ConfigFile";
import SlaveServer from "./SlaveServer";
import Deploy from "./Deploy";

@Entity()
class Project {
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
  afterDeployCommands: string;

  @Column({ nullable: false, default: true })
  active: boolean;

  @Column({ nullable: false, default: false })
  autoUpdate: boolean;

  @OneToMany(() => ConfigFile, (configFile) => configFile.project, { cascade: true })
  configFiles: ConfigFile[];

  @OneToMany(() => Deploy, (deploy) => deploy.project, { cascade: true })
  deploys: Deploy[];

  @ManyToOne(() => SlaveServer, (slaveServer) => slaveServer.projects, { nullable: true, cascade: true })
  slaveServer: SlaveServer | null;
}

export default Project;
