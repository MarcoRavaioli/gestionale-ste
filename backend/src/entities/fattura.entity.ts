import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { Commessa } from './commessa.entity';
import { Allegato } from './allegato.entity';

export enum TipoFattura {
  ENTRATA = 'entrata', // Fattura emessa al cliente
  USCITA = 'uscita', // Fattura ricevuta da fornitore (acquisto)
}

@Entity()
export class Fattura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numero_fattura: string; // Es: "34/2025" o "Fatt. Acquisto 201"

  @Column({ type: 'date' }) // Basta date, l'ora di emissione è superflua
  data_emissione: Date;

  @Column({ type: 'text', nullable: true })
  descrizione: string; // <--- AGGIUNTO: Es. "Acconto 30% fornitura serramenti PVC"

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totale: number;

  @Column({
    type: 'simple-enum', // Su SQLite simple-enum salva la stringa, va benissimo
    enum: TipoFattura,
    default: TipoFattura.ENTRATA,
  })
  tipo: TipoFattura;

  @Column({ type: 'date', nullable: true })
  data_scadenza: Date;

  @Column({ default: false })
  incassata: boolean; // O "pagata" se è un'uscita

  // CORREZIONE CRITICA: nullable: true
  // Se è una spesa (benzina), non c'è un Cliente collegato.
  @ManyToOne(() => Cliente, (cliente) => cliente.fatture, { nullable: true })
  cliente: Cliente | null;

  @ManyToOne(() => Commessa, (commessa) => commessa.fatture, { nullable: true })
  commessa: Commessa | null;

  @OneToMany(() => Allegato, (allegato) => allegato.fattura, {
    cascade: true,
    nullable: true,
  })
  allegati: Allegato[] | null;

  @DeleteDateColumn({ select: false })
  deletedAt: Date;
}
