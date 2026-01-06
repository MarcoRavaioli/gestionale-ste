import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { Commessa } from './commessa.entity';

@Entity()
export class Indirizzo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  via: string; // <--- Prima forse si chiamava 'indirizzo'

  @Column()
  civico: string; // <--- Aggiunto campo specifico

  @Column()
  citta: string;

  @Column()
  cap: string; // <--- Aggiunto campo specifico

  // Rendiamo la provincia OPZIONALE (nullable: true)
  @Column({ nullable: true })
  provincia: string;

  @Column({ default: 'Italia' })
  stato: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.indirizzi, {
    onDelete: 'CASCADE',
  })
  cliente: Cliente;

  @OneToMany(() => Commessa, (commessa) => commessa.indirizzo)
  commesse: Commessa[];
}
