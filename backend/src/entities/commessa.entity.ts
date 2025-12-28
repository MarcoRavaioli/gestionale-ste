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
import { Allegato } from './allegato.entity'; // <--- Importa

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

  @Column({ default: 'APERTA' })
  stato: string;

  @OneToMany(() => Appuntamento, (app) => app.commessa)
  appuntamenti: Appuntamento[];

  @OneToMany(() => Fattura, (fattura) => fattura.commessa)
  fatture: Fattura[];

  @OneToMany(() => Allegato, (allegato) => allegato.commessa)
  allegati: Allegato[];
}
