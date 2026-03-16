import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import ProjectInstance from "./ProjectInstance";

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

  @ManyToOne(() => ProjectInstance, (instance) => instance.configFiles, { nullable: false })
  projectInstance: ProjectInstance;
}

export default ConfigFile;
