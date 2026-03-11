import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, DeleteDateColumn, AfterRemove } from 'typeorm';
import { Commessa } from './commessa.entity';
import { Fattura } from './fattura.entity';
import { Cliente } from './cliente.entity';
import { Indirizzo } from './indirizzo.entity';
import { Appuntamento } from './appuntamento.entity';

@Entity()
export class Allegato {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome_file: string;

  @Column()
  percorso: string;

  @Column({ nullable: true })
  tipo_file: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_caricamento: Date;

  // RELAZIONI FLESSIBILI (Tutte opzionali)
  @ManyToOne(() => Cliente, (cliente) => cliente.allegati, { onDelete: 'CASCADE', nullable: true })
  cliente: Cliente;

  @ManyToOne(() => Indirizzo, (indirizzo) => indirizzo.allegati, { onDelete: 'CASCADE', nullable: true })
  indirizzo: Indirizzo;

  @ManyToOne(() => Commessa, (commessa) => commessa.allegati, { onDelete: 'CASCADE', nullable: true })
  commessa: Commessa;

  @ManyToOne(() => Appuntamento, (appuntamento) => appuntamento.allegati, { onDelete: 'CASCADE', nullable: true })
  appuntamento: Appuntamento;

  @ManyToOne(() => Fattura, (fattura) => fattura.allegati, { onDelete: 'CASCADE', nullable: true })
  fattura: Fattura;

  @DeleteDateColumn({ select: false })
  deletedAt: Date;

  @AfterRemove()
  async removePhysicalFile() {
    if (this.percorso) {
      // Cancellazione asincrona non bloccante
      const fs = require('fs');
      try {
        if (fs.existsSync(this.percorso)) {
          // Fire and forget
          fs.promises.unlink(this.percorso).catch((err: any) => {
            console.error(`Errore durante la rimozione asincrona del file ${this.percorso}:`, err);
          });
        }
      } catch (err) {
        console.error(`Errore nel check di esistenza file ${this.percorso}:`, err);
      }
    }
  }
}