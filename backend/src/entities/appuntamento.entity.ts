import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable, // <--- 1. IMPORTA QUESTO
} from 'typeorm';
import { Commessa } from './commessa.entity';
import { Collaboratore } from './collaboratore.entity';

@Entity()
export class Appuntamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  data_ora: Date;

  @Column({ type: 'text', nullable: true })
  descrizione: string;

  // Collegato alla commessa
  @ManyToOne(() => Commessa, (commessa) => commessa.appuntamenti, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  commessa: Commessa;

  // Collegato ai collaboratori (Squadra)
  @ManyToMany(
    () => Collaboratore,
    (collaboratore) => collaboratore.appuntamenti,
  )
  @JoinTable() // <--- 2. AGGIUNGI QUESTO! Fondamentale.
  collaboratori: Collaboratore[];
}
