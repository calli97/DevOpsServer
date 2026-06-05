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

  @Column({ type: "text", nullable: true })
  command: string | null;

  @Column({ default: false })
  created: boolean;

  @ManyToOne(() => ProjectInstance, (instance) => instance.nginxConfigs, { nullable: false })
  projectInstance: ProjectInstance;
}

export default NginxConfig;
