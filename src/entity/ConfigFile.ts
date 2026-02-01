import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Deploy from "./Deploy";

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

  @ManyToOne(() => Deploy, (deploy) => deploy.configFiles, { nullable: false })
  deploy: Deploy;
}

export default ConfigFile;
