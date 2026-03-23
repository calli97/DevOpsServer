import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import ProjectInstance from "./ProjectInstance";

@Entity()
class NginxConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  path: string;

  @Column({ type: "text", nullable: false })
  content: string;

  @Column({ type: "text", nullable: false })
  command: string;

  @ManyToOne(() => ProjectInstance, (instance) => instance.nginxConfigs, { nullable: false })
  projectInstance: ProjectInstance;
}

export default NginxConfig;
