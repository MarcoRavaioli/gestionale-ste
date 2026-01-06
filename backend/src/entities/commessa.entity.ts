import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
// RIMOSSO: import { Cliente } ... non serve più qui
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

  // --- MODIFICA QUI ---
  // 1. Abbiamo tolto la relazione diretta @ManyToOne con Cliente

  // 2. La relazione con Indirizzo ora è il "genitore" principale
  // (Ho tolto nullable: true perché senza indirizzo la commessa "vola nel nulla")
  @ManyToOne(() => Indirizzo, (indirizzo) => indirizzo.commesse, {
    onDelete: 'CASCADE', // Se cancello l'indirizzo, spariscono le commesse
    nullable: false,
  })
  indirizzo: Indirizzo;

  @OneToMany(() => Appuntamento, (app) => app.commessa)
  appuntamenti: Appuntamento[];

  @OneToMany(() => Fattura, (fattura) => fattura.commessa)
  fatture: Fattura[];

  @OneToMany(() => Allegato, (allegato) => allegato.commessa)
  allegati: Allegato[];
}
