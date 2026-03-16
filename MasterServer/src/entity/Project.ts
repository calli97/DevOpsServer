import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import ProjectInstance from "./ProjectInstance";

@Entity()
class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  repository: string;

  @Column({ nullable: false })
  cloneLine: string;

  @Column({ nullable: false, default: true })
  active: boolean;

  @OneToMany(() => ProjectInstance, (instance) => instance.project, {
    cascade: true,
  })
  instances: ProjectInstance[];
}

export default Project;
