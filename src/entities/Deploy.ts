import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
class Deploy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  path: string;
}

export default Deploy;
