import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
class Deploy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  path: string;

  @Column({ nullable: false })
  repository: string;

  @Column({ nullable: false })
  branch: string;

  @Column({ nullable: true })
  commands: string;

  @Column({ nullable: true })
  port: number;

  @Column({ nullable: false, default: false })
  expose: boolean;
}

export default Deploy;
