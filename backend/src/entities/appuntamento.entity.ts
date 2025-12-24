import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cliente } from './cliente.entity';
import { Commessa } from './commessa.entity';

@Entity()
export class Appuntamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  data_ora: Date;

  @Column({ type: 'text', nullable: true })
  descrizione: string;

  // Collegato al cliente (per info rapide)
  @ManyToOne(() => Cliente, (cliente) => cliente.appuntamenti)
  cliente: Cliente;

  // Collegato alla commessa
  @ManyToOne(() => Commessa, (commessa) => commessa.appuntamenti)
  commessa: Commessa;
}
