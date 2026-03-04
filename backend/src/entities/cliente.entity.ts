import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn } from 'typeorm';
import { Indirizzo } from './indirizzo.entity';
import { Fattura } from './fattura.entity';
import { Commessa } from './commessa.entity';
import { Appuntamento } from './appuntamento.entity';
import { Allegato } from './allegato.entity';

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

  @OneToMany(() => Commessa, (commessa) => commessa.cliente)
  commesse: Commessa[];

  @OneToMany(() => Appuntamento, (appuntamento) => appuntamento.cliente)
  appuntamenti: Appuntamento[];

  @OneToMany(() => Fattura, (fattura) => fattura.cliente)
  fatture: Fattura[];

  @OneToMany(() => Allegato, (allegato) => allegato.cliente)
  allegati: Allegato[];

  @DeleteDateColumn({ select: false })
  deletedAt: Date;
}