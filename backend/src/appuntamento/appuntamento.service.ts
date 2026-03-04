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
      relations: [
        'commessa',
        'commessa.indirizzo',
        'commessa.indirizzo.cliente',
        'commessa.cliente', // Nel caso in cui la commessa sia diretta
        'indirizzo',        // Appuntamento diretto al cantiere
        'indirizzo.cliente',// Cliente del cantiere diretto
        'cliente',          // Appuntamento diretto al cliente
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
        'commessa.cliente',
        'indirizzo',
        'indirizzo.cliente',
        'cliente',
        'collaboratori',
      ],
    });
  }

  update(id: number, updateDto: any) {
    return this.appuntamentoRepository.update(id, updateDto);
  }

  remove(id: number) {
    return this.appuntamentoRepository.softDelete(id);
  }
}