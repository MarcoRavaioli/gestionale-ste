import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, DeleteDateColumn } from 'typeorm';
import { Cliente } from './cliente.entity';
import { Commessa } from './commessa.entity';
import { Appuntamento } from './appuntamento.entity';
import { Allegato } from './allegato.entity';

@Entity()
export class Indirizzo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  via: string;

  @Column()
  civico: string;

  @Column()
  citta: string;

  @Column()
  cap: string;

  @Column({ nullable: true })
  provincia: string;

  @Column({ default: 'Italia' })
  stato: string;

  // Cliente è opzionale (Cantiere svincolato)
  @ManyToOne(() => Cliente, (cliente) => cliente.indirizzi, { onDelete: 'CASCADE', nullable: true })
  cliente: Cliente;

  @OneToMany(() => Commessa, (commessa) => commessa.indirizzo)
  commesse: Commessa[];

  @OneToMany(() => Appuntamento, (appuntamento) => appuntamento.indirizzo)
  appuntamenti: Appuntamento[];

  @OneToMany(() => Allegato, (allegato) => allegato.indirizzo)
  allegati: Allegato[];

  @DeleteDateColumn({ select: false })
  deletedAt: Date;
}