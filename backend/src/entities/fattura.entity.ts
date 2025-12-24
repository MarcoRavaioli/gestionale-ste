import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cliente } from './cliente.entity';
import { Commessa } from './commessa.entity';

export enum TipoFattura {
  ENTRATA = 'entrata',
  USCITA = 'uscita',
}

@Entity()
export class Fattura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numero_fattura: string;

  @Column({ type: 'datetime' })
  data_emissione: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totale: number;

  @Column({
    type: 'simple-enum',
    enum: TipoFattura,
    default: TipoFattura.ENTRATA,
  })
  tipo: TipoFattura;

  // Scadenza incasso (default calcolato lato service, qui salviamo la data)
  @Column({ type: 'datetime', nullable: true })
  data_scadenza: Date;

  @Column({ default: false })
  incassata: boolean;

  @ManyToOne(() => Cliente, (cliente) => cliente.fatture)
  cliente: Cliente;

  @ManyToOne(() => Commessa, (commessa) => commessa.fatture, { nullable: true })
  commessa: Commessa;
}
