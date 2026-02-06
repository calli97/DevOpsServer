import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Project from "./Project";

@Entity()
class ConfigFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  relativePath: string;

  @Column({ type: "text", nullable: false })
  content: string;

  @ManyToOne(() => Project, (project) => project.configFiles, { nullable: false })
  project: Project;
}

export default ConfigFile;
