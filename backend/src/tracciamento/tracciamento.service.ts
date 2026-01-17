import {
  Injectable,
  ConflictException,
  NotFoundException, // <--- 1. AGGIUNGI QUESTO IMPORT
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TracciamentoPersonale } from '../entities/tracciamento.entity';
import { CreateTracciamentoDto } from './dto/create-tracciamento.dto';
import { Collaboratore } from '../entities/collaboratore.entity';

@Injectable()
export class TracciamentoService {
  constructor(
    @InjectRepository(TracciamentoPersonale)
    private repo: Repository<TracciamentoPersonale>,
    @InjectRepository(Collaboratore)
    private collabRepo: Repository<Collaboratore>,
  ) {}

  // --- CREAZIONE (Già fatto, OK) ---
  async create(userId: number, dto: CreateTracciamentoDto) {
    const esisteGia = await this.repo.findOne({
      where: {
        collaboratore: { id: userId },
        giorno: dto.giorno,
      },
    });

    if (esisteGia) {
      throw new ConflictException(
        'Hai già inserito un rapporto per questa data!',
      );
    }

    const nuovo = this.repo.create({
      ...dto,
      collaboratore: { id: userId },
    });
    return this.repo.save(nuovo);
  }

  // --- NUOVO: AGGIORNAMENTO (Fix "Non posso modificare") ---
  async update(id: number, userId: number, dto: any) {
    // Usa UpdateTracciamentoDto se lo hai creato, altrimenti any/Partial
    // 1. Trova il rapportino esistente (e verifica che sia dell'utente)
    const report = await this.repo.findOne({
      where: { id, collaboratore: { id: userId } },
    });

    if (!report) {
      throw new NotFoundException('Rapportino non trovato o non tuo.');
    }

    // 2. CONTROLLO ANTI-DUPLICATO IN MODIFICA
    // Se l'utente sta cambiando la data (e la nuova data è diversa dalla vecchia)
    if (dto.giorno && dto.giorno !== report.giorno) {
      const giornoOccupato = await this.repo.findOne({
        where: {
          collaboratore: { id: userId },
          giorno: dto.giorno,
        },
      });

      if (giornoOccupato) {
        throw new ConflictException(
          'Non puoi spostare il rapporto: data già occupata!',
        );
      }
    }

    // 3. Esegui l'aggiornamento
    return this.repo.update(id, dto);
  }

  // ... (findMyHistory, getMonthlyReport, etc. restano uguali)

  async findMyHistory(userId: number, mese?: string) {
    return this.repo.find({
      where: { collaboratore: { id: userId } },
      order: { giorno: 'DESC' },
      take: 50,
    });
  }

  async getMonthlyReport(anno: number, mese: number) {
    // ... (Logica Manager invariata)
    const collaboratori = await this.collabRepo.find({
      where: { ruolo: 'COLLABORATORE' },
      relations: ['tracciamenti'],
    });

    const report = collaboratori.map((col) => {
      const inserimentiDelMese = col.tracciamenti.filter((t) => {
        const d = new Date(t.giorno);
        return d.getFullYear() === anno && d.getMonth() + 1 === mese;
      });

      const totaleOre = inserimentiDelMese.reduce(
        (sum, t) => sum + t.ore_lavorate,
        0,
      );
      const totaleBuoni = inserimentiDelMese.filter(
        (t) => t.buono_pasto,
      ).length;

      // Valori indicativi (o presi da DB se implementato)
      const costoOrario = 10;
      const valoreBuono = 5.29;
      const totaleDaPagare =
        totaleOre * costoOrario + totaleBuoni * valoreBuono;

      return {
        id: col.id,
        nome: col.nome + ' ' + (col.cognome || ''),
        totaleOre,
        totaleBuoni,
        totaleDaPagare,
        dettagli: inserimentiDelMese,
      };
    });
    return report;
  }

  async getCompletionStatus(anno: number, mese: number) {
    // ... (Logica pallini verdi invariata)
    const totalCollaboratori = await this.collabRepo.count({
      where: { ruolo: 'COLLABORATORE' },
    });
    if (totalCollaboratori === 0) return [];

    const start = new Date(anno, mese - 1, 1);
    const end = new Date(anno, mese, 0);

    const tracciamenti = await this.repo
      .createQueryBuilder('t')
      .select('t.giorno', 'giorno')
      .addSelect('COUNT(DISTINCT t.collaboratoreId)', 'conteggio')
      .where('t.giorno >= :start AND t.giorno <= :end', {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      })
      .groupBy('t.giorno')
      .getRawMany();

    return tracciamenti
      .filter((t) => parseInt(t.conteggio) >= totalCollaboratori)
      .map((t) => t.giorno);
  }

  async remove(id: number, userId: number) {
    const tracciamento = await this.repo.findOne({
      where: { id, collaboratore: { id: userId } },
    });
    if (!tracciamento) {
      throw new Error('Rapportino non trovato o non autorizzato');
    }
    return this.repo.remove(tracciamento);
  }
}
