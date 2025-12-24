import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cliente } from './cliente.entity';

@Entity()
export class Indirizzo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'Italia' })
  stato: string;

  @Column()
  provincia: string;

  @Column()
  citta: string;

  @Column()
  indirizzo: string; // Via/Piazza

  @Column({ type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.indirizzi)
  cliente: Cliente;
}
