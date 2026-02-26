import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAppuntamentoDto } from './dto/create-appuntamento.dto';
import { Appuntamento } from '../entities/appuntamento.entity';

@Injectable()
export class AppuntamentoService {
  constructor(
    @InjectRepository(Appuntamento)
    private readonly appuntamentoRepository: Repository<Appuntamento>,
  ) {}

  create(createDto: CreateAppuntamentoDto) {
    const nuovoApp = this.appuntamentoRepository.create(createDto as any);
    return this.appuntamentoRepository.save(nuovoApp);
  }

  findAll() {
    return this.appuntamentoRepository.find({
      // Risaliamo la corrente: Appuntamento -> Commessa -> Indirizzo -> Cliente
      relations: [
        'commessa',
        'commessa.indirizzo',
        'commessa.indirizzo.cliente',
        'collaboratori',
      ],
    });
  }

  findOne(id: number) {
    return this.appuntamentoRepository.findOne({
      where: { id },
      relations: [
        'commessa',
        'commessa.indirizzo',
        'commessa.indirizzo.cliente',
        'collaboratori',
      ],
    });
  }

  // update e remove standard...
  update(id: number, updateDto: any) {
    return this.appuntamentoRepository.update(id, updateDto);
  }

  remove(id: number) {
    return this.appuntamentoRepository.softDelete(id);
  }
}
