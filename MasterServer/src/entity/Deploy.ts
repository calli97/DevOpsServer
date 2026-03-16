import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import ProjectInstance from "./ProjectInstance";

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

  @ManyToOne(() => ProjectInstance, (instance) => instance.deploys, { nullable: false })
  projectInstance: ProjectInstance;
}

export default Deploy;
