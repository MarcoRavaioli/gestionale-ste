import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Collaboratore } from './collaboratore.entity';
import { Commessa } from './commessa.entity'; // <--- AGGIUNTA FONDAMENTALE

@Entity()
export class TracciamentoPersonale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  giorno: string; // YYYY-MM-DD

  @Column({ type: 'float' })
  ore_lavorate: number; // Es: 4.5

  @Column({ type: 'text', nullable: true })
  descrizione: string; // Es: "Posa falsi telai piano terra"

  @Column({ default: false })
  pasto_rimborsato: boolean;

  // CHI ha lavorato?
  @ManyToOne(() => Collaboratore, (collab) => collab.tracciamenti, {
    onDelete: 'CASCADE',
  })
  collaboratore: Collaboratore;

  // DOVE ha lavorato?
  @ManyToOne(() => Commessa, { nullable: true }) // Nullable true se lavorano in magazzino/generico
  commessa: Commessa | null;
}
