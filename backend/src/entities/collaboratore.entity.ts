import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
} from 'typeorm';
// Assicurati che il percorso sia corretto, altrimenti commenta finché non creiamo il Tracciamento
import { TracciamentoPersonale } from './tracciamento.entity';
import { Appuntamento } from './appuntamento.entity';

@Entity()
export class Collaboratore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  cognome: string;

  // CRITICITÀ RISOLTA: Contatti per il cantiere
  @Column({ nullable: true })
  telefono: string;

  // CRITICITÀ RISOLTA: Credenziali per il Login (Auth)
  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // select: false impedisce di restituire la password nelle GET per sicurezza
  password: string;

  // CRITICITÀ RISOLTA: Chi è?
  @Column({ default: 'COLLABORATORE' })
  ruolo: string; // Es: ADMIN, COLLABORATORE, COMMERCIALE

  @OneToMany(() => TracciamentoPersonale, (traccia) => traccia.collaboratore)
  tracciamenti: TracciamentoPersonale[];

  @ManyToMany(() => Appuntamento, (appuntamento) => appuntamento.collaboratori)
  appuntamenti: Appuntamento[];
}
