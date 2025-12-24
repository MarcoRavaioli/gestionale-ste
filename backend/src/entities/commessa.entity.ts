import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { Appuntamento } from './appuntamento.entity';
import { Fattura } from './fattura.entity';

@Entity()
export class Commessa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  seriale: string;

  @Column({ nullable: true })
  descrizione: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.commesse)
  cliente: Cliente;

  @OneToMany(() => Appuntamento, (app) => app.commessa)
  appuntamenti: Appuntamento[];

  @OneToMany(() => Fattura, (fattura) => fattura.commessa)
  fatture: Fattura[];
}
