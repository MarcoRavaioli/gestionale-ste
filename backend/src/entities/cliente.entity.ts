import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Indirizzo } from './indirizzo.entity';
import { Appuntamento } from './appuntamento.entity';
import { Commessa } from './commessa.entity';
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

  // Relazioni
  @OneToMany(() => Indirizzo, (indirizzo) => indirizzo.cliente)
  indirizzi: Indirizzo[];

  @OneToMany(() => Appuntamento, (app) => app.cliente)
  appuntamenti: Appuntamento[];

  @OneToMany(() => Commessa, (commessa) => commessa.cliente)
  commesse: Commessa[];

  @OneToMany(() => Fattura, (fattura) => fattura.cliente)
  fatture: Fattura[];
}
