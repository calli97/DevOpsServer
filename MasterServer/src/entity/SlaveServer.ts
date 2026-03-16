import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import ProjectInstance from "./ProjectInstance";

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

  @OneToMany(() => ProjectInstance, (instance) => instance.slaveServer)
  instances: ProjectInstance[];
}

export default SlaveServer;
