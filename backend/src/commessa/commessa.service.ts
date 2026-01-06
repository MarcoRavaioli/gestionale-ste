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
    // TypeORM collegherà automaticamente l'indirizzo grazie alla struttura del DTO
    const nuovaCommessa = this.commessaRepository.create(createDto as any);
    return this.commessaRepository.save(nuovaCommessa);
  }

  findAll() {
    return this.commessaRepository.find({
      // Se vuoi vedere di chi è la commessa, devi risalire la catena:
      relations: ['indirizzo', 'indirizzo.cliente'],
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

  remove(id: number) {
    return this.commessaRepository.delete(id);
  }
}
