import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIndirizzoDto } from './dto/create-indirizzo.dto';
import { UpdateIndirizzoDto } from './dto/update-indirizzo.dto';
import { Indirizzo } from '../entities/indirizzo.entity';

@Injectable()
export class IndirizzoService {
  constructor(
    @InjectRepository(Indirizzo)
    private readonly indirizzoRepository: Repository<Indirizzo>,
  ) {}

  create(createDto: CreateIndirizzoDto) {
    // TypeORM gestisce automaticamente la relazione se l'oggetto è formato bene
    const nuovoIndirizzo = this.indirizzoRepository.create(createDto as any);
    return this.indirizzoRepository.save(nuovoIndirizzo);
  }

  findAll() {
    return this.indirizzoRepository.find({ relations: ['cliente'] });
  }

  findOne(id: number) {
    return this.indirizzoRepository.findOne({
      where: { id },
      relations: ['cliente'],
    });
  }

  update(id: number, updateDto: UpdateIndirizzoDto) {
    return this.indirizzoRepository.update(id, updateDto as any);
  }

  remove(id: number) {
    return this.indirizzoRepository.softDelete(id);
  }
}
