import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, OneToMany, DeleteDateColumn } from 'typeorm';
import { Commessa } from './commessa.entity';
import { Collaboratore } from './collaboratore.entity';
import { Cliente } from './cliente.entity';
import { Indirizzo } from './indirizzo.entity';
import { Allegato } from './allegato.entity';

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

  // Tutte le relazioni padre sono opzionali
  @ManyToOne(() => Cliente, (cliente) => cliente.appuntamenti, { nullable: true, onDelete: 'CASCADE' })
  cliente: Cliente;

  @ManyToOne(() => Indirizzo, (indirizzo) => indirizzo.appuntamenti, { nullable: true, onDelete: 'CASCADE' })
  indirizzo: Indirizzo;

  @ManyToOne(() => Commessa, (commessa) => commessa.appuntamenti, { nullable: true, onDelete: 'CASCADE' })
  commessa: Commessa;

  @ManyToMany(() => Collaboratore, (collaboratore) => collaboratore.appuntamenti)
  @JoinTable()
  collaboratori: Collaboratore[];

  @OneToMany(() => Allegato, (allegato) => allegato.appuntamento)
  allegati: Allegato[];

  @DeleteDateColumn({ select: false })
  deletedAt: Date;
}