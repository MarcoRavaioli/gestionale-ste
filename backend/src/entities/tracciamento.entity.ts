import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, DeleteDateColumn } from 'typeorm';
import { Collaboratore } from './collaboratore.entity';

@Entity()
export class TracciamentoPersonale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' }) // YYYY-MM-DD
  giorno: string;

  @Column('float')
  ore_lavorate: number;

  @Column({ default: false })
  buono_pasto: boolean; // True se ha mangiato

  @Column({ nullable: true })
  descrizione: string; // Opzionale: "Montaggio infissi cantiere X"

  // Relazione: Un tracciamento appartiene a UN collaboratore
  @ManyToOne(() => Collaboratore, (col) => col.tracciamenti, {
    onDelete: 'CASCADE',
  })
  collaboratore: Collaboratore;

  @DeleteDateColumn({ select: false })
  deletedAt: Date;
}
