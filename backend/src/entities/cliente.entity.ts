import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Indirizzo } from './indirizzo.entity';
import { Fattura } from './fattura.entity';

@Entity()
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => Indirizzo, (indirizzo) => indirizzo.cliente)
  indirizzi: Indirizzo[];

  @OneToMany(() => Fattura, (fattura) => fattura.cliente)
  fatture: Fattura[];
}
