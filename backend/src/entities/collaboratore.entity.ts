import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  DeleteDateColumn,
} from 'typeorm';
import { TracciamentoPersonale } from './tracciamento.entity';
import { Appuntamento } from './appuntamento.entity';

@Entity()
export class Collaboratore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ nullable: true })
  cognome: string;

  @Column({ nullable: true })
  telefono: string;

  // NUOVO CAMPO PRINCIPALE PER LOGIN
  @Column({ unique: true })
  nickname: string;

  // Email diventa opzionale
  @Column({ nullable: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: 'COLLABORATORE' })
  ruolo: string; // 'ADMIN', 'MANAGER', 'COLLABORATORE'

  @OneToMany(() => TracciamentoPersonale, (traccia) => traccia.collaboratore)
  tracciamenti: TracciamentoPersonale[];

  @ManyToMany(() => Appuntamento, (appuntamento) => appuntamento.collaboratori)
  appuntamenti: Appuntamento[];

  @DeleteDateColumn({ select: false })
  deletedAt: Date;
}
