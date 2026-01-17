import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Commessa } from './commessa.entity';
import { Fattura } from './fattura.entity';

@Entity()
export class Allegato {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome_file: string; // Es: "Contratto_Firmato.pdf"

  @Column()
  percorso: string; // Es: "/uploads/2025/commessa_1/12345-contratto.pdf"

  @Column({ nullable: true })
  tipo_file: string; // Es: "application/pdf" o "image/jpeg"

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  data_caricamento: Date;

  @ManyToOne(() => Commessa, (commessa) => commessa.allegati, {
    onDelete: 'CASCADE',
  })
  commessa: Commessa;

  @ManyToOne(() => Fattura, (fattura) => fattura.allegati, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  fattura: Fattura;
}
