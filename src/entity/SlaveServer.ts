import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Deploy from "./Deploy";

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

  @OneToMany(() => Deploy, (deploy) => deploy.slaveServer)
  deploys: Deploy[];
}

export default SlaveServer;
