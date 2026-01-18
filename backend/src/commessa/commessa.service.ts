import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommessaDto } from './dto/create-commessa.dto';
import { Commessa } from '../entities/commessa.entity';
import { UpdateCommessaDto } from './dto/update-commessa.dto';

@Injectable()
export class CommessaService {
  constructor(
    @InjectRepository(Commessa)
    private readonly commessaRepository: Repository<Commessa>,
  ) {}

  create(createDto: CreateCommessaDto) {
    const nuovaCommessa = this.commessaRepository.create(createDto as any);
    return this.commessaRepository.save(nuovaCommessa);
  }

  findAll() {
    return this.commessaRepository.find({
      // CORREZIONE QUI: Aggiunto 'allegati' per popolare l'array nel frontend
      relations: ['indirizzo', 'indirizzo.cliente', 'allegati'],

      // Opzionale: Ordina per data creazione o seriale
      order: { id: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.commessaRepository.findOne({
      where: { id },
      relations: [
        'indirizzo',
        'indirizzo.cliente',
        'appuntamenti',
        'allegati',
        'fatture',
      ],
    });
  }

  async update(id: number, updateDto: UpdateCommessaDto) {
    const datiPuliti: Partial<UpdateCommessaDto> = { ...updateDto };

    if ('appuntamenti' in datiPuliti) delete datiPuliti.appuntamenti;
    if ('fatture' in datiPuliti) delete datiPuliti.fatture;
    if ('allegati' in datiPuliti) delete datiPuliti.allegati;

    await this.commessaRepository.update(id, datiPuliti);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.commessaRepository.delete(id);
    return { deleted: true };
  }
}
