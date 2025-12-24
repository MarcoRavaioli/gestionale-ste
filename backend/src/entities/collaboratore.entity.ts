import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TracciamentoPersonale } from './tracciamento.entity';

@Entity()
export class Collaboratore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  cognome: string;

  @OneToMany(() => TracciamentoPersonale, (traccia) => traccia.collaboratore)
  tracciamenti: TracciamentoPersonale[];
}
