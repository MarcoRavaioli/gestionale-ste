import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommessaDto } from './dto/create-commessa.dto';
import { Commessa } from '../entities/commessa.entity';

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

  // update e remove rimangono standard...
  update(id: number, updateDto: any) {
    return this.commessaRepository.update(id, updateDto);
  }
  remove(id: number) {
    return this.commessaRepository.delete(id);
  }
}
