import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import ProjectInstance from "./ProjectInstance";

@Entity()
class SlaveServer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  nombre: string;

  @Column({ nullable: false })
  host: string;

  @Column({ nullable: true })
  puerto: number | null;

  @Column({ nullable: false })
  apiKey: string;

  @OneToMany(() => ProjectInstance, (instance) => instance.slaveServer)
  instances: ProjectInstance[];
}

export default SlaveServer;
