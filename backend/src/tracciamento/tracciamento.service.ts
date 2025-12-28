import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTracciamentoDto } from './dto/create-tracciamento.dto';
import { UpdateTracciamentoDto } from './dto/update-tracciamento.dto'; // <--- Importante!
import { TracciamentoPersonale } from '../entities/tracciamento.entity';
import { Collaboratore } from '../entities/collaboratore.entity';
import { Commessa } from '../entities/commessa.entity';

@Injectable()
export class TracciamentoService {
  constructor(
    @InjectRepository(TracciamentoPersonale)
    private readonly tracciamentoRepository: Repository<TracciamentoPersonale>,
    @InjectRepository(Collaboratore)
    private readonly collaboratoreRepository: Repository<Collaboratore>,
    @InjectRepository(Commessa)
    private readonly commessaRepository: Repository<Commessa>,
  ) {}

  async create(createDto: CreateTracciamentoDto) {
    // 1. Cerco il Collaboratore
    const collaboratore = await this.collaboratoreRepository.findOneBy({
      id: createDto.collaboratoreId,
    });
    if (!collaboratore) {
      throw new NotFoundException(
        `Collaboratore ID ${createDto.collaboratoreId} non trovato`,
      );
    }

    // 2. FIX: Definisco il tipo esplicitamente per evitare errori TS
    let commessa: Commessa | null = null;

    if (createDto.commessaId) {
      commessa = await this.commessaRepository.findOneBy({
        id: createDto.commessaId,
      });
      if (!commessa) {
        throw new NotFoundException(
          `Commessa ID ${createDto.commessaId} non trovata`,
        );
      }
    }

    // 3. Creo il tracciamento
    const nuovoTracciamento = this.tracciamentoRepository.create({
      giorno: createDto.giorno,
      ore_lavorate: createDto.ore_lavorate,
      descrizione: createDto.descrizione,
      pasto_rimborsato: createDto.pasto_rimborsato || false,
      collaboratore: collaboratore,
      commessa: commessa, // Ora TS sa che qui può andare un oggetto Commessa o null
    });

    return this.tracciamentoRepository.save(nuovoTracciamento);
  }

  findAll() {
    return this.tracciamentoRepository.find({
      relations: ['collaboratore', 'commessa'],
    });
  }

  findOne(id: number) {
    return this.tracciamentoRepository.findOne({
      where: { id },
      relations: ['collaboratore', 'commessa'],
    });
  }

  // METODO AGGIUNTO
  update(id: number, updateDto: UpdateTracciamentoDto) {
    return this.tracciamentoRepository.update(id, updateDto);
  }

  // METODO AGGIUNTO
  remove(id: number) {
    return this.tracciamentoRepository.delete(id);
  }
}
