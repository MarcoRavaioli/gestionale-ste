import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Indirizzo } from './indirizzo.entity';
import { Appuntamento } from './appuntamento.entity';
import { Fattura } from './fattura.entity';
import { Allegato } from './allegato.entity';

@Entity()
export class Commessa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  seriale: string;

  @Column({ nullable: true })
  descrizione: string;

  @Column({ default: 'APERTA' })
  stato: string;

  @Column({ nullable: true, type: 'float' })
  valore_totale: number;

  @ManyToOne(() => Indirizzo, (indirizzo) => indirizzo.commesse, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  indirizzo: Indirizzo;

  @OneToMany(() => Appuntamento, (app) => app.commessa)
  appuntamenti: Appuntamento[];

  @OneToMany(() => Fattura, (fattura) => fattura.commessa)
  fatture: Fattura[];

  @OneToMany(() => Allegato, (allegato) => allegato.commessa)
  allegati: Allegato[];

  @DeleteDateColumn({ select: false })
  deletedAt: Date;
}
