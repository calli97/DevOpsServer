import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Project from "./Project";

@Entity()
class SlaveServer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  nombre: string;

  @Column({ nullable: false })
  direccionIp: string;

  @Column({ nullable: false })
  puerto: number;

  @Column({ nullable: false })
  apiKey: string;

  @OneToMany(() => Project, (project) => project.slaveServer)
  projects: Project[];
}

export default SlaveServer;
