import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Project from "./Project";

@Entity()
class Deploy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  startPath: string;

  @Column({ type: "text", nullable: true })
  buildCommands: string;

  @Column({ nullable: false })
  startCommands: string;

  @ManyToOne(() => Project, (project) => project.deploys, { nullable: false })
  project: Project;
}

export default Deploy;
