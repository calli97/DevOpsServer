import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
class Deploy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  path: string;

  @Column()
  repository: string;

  @Column()
  branch: string;

  @Column()
  commands: string;
}

export default Deploy;
