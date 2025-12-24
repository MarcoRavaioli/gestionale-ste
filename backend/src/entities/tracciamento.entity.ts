import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Collaboratore } from './collaboratore.entity';

@Entity()
export class TracciamentoPersonale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  giorno: string;

  @Column({ type: 'float' })
  ore_lavorate: number;

  @Column({ default: false })
  pasto_rimborsato: boolean;

  @ManyToOne(() => Collaboratore, (collab) => collab.tracciamenti)
  collaboratore: Collaboratore;
}
