import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import Project from "./Project";
import SlaveServer from "./SlaveServer";
import ConfigFile from "./ConfigFile";
import Deploy from "./Deploy";

@Entity()
class ProjectInstance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  branch: string;

  @Column({ nullable: false })
  path: string;

  @Column({ nullable: false, default: false })
  autoUpdate: boolean;

  @Column({ nullable: false, default: false })
  cloned: boolean;

  @Column({ type: "text", nullable: true })
  afterDeployCommands: string;

  @ManyToOne(() => Project, (project) => project.instances, { nullable: false })
  project: Project;

  @ManyToOne(() => SlaveServer, (slaveServer) => slaveServer.instances, {
    nullable: true,
  })
  slaveServer: SlaveServer | null;

  @OneToMany(() => ConfigFile, (configFile) => configFile.projectInstance, {
    cascade: true,
  })
  configFiles: ConfigFile[];

  @OneToMany(() => Deploy, (deploy) => deploy.projectInstance, {
    cascade: true,
  })
  deploys: Deploy[];
}

export default ProjectInstance;
