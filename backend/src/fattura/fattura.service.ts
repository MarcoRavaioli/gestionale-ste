import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFatturaDto } from './dto/create-fattura.dto';
import { UpdateFatturaDto } from './dto/update-fattura.dto';
import { Fattura } from '../entities/fattura.entity';
import { Cliente } from '../entities/cliente.entity';
import { Commessa } from '../entities/commessa.entity';

@Injectable()
export class FatturaService {
  constructor(
    @InjectRepository(Fattura)
    private readonly fatturaRepository: Repository<Fattura>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Commessa)
    private readonly commessaRepository: Repository<Commessa>,
  ) {}

  async create(createDto: CreateFatturaDto) {
    // FIX: Diciamo esplicitamente a TS che questa variabile può contenere un Cliente oppure null
    let cliente: Cliente | null = null;

    if (createDto.clienteId) {
      cliente = await this.clienteRepository.findOneBy({
        id: createDto.clienteId,
      });
      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${createDto.clienteId} non trovato`,
        );
      }
    }

    // FIX: Idem per la commessa
    let commessa: Commessa | null = null;

    if (createDto.commessaId) {
      commessa = await this.commessaRepository.findOneBy({
        id: createDto.commessaId,
      });
      if (!commessa) {
        throw new NotFoundException(
          `Commessa con ID ${createDto.commessaId} non trovata`,
        );
      }
    }

    // 3. Creazione Fattura
    const nuovaFattura = this.fatturaRepository.create({
      ...createDto, // Copia i campi semplici (numero, data, totale...)
      cliente: cliente, // Assegna l'oggetto Cliente (o null)
      commessa: commessa, // Assegna l'oggetto Commessa (o null)
    });

    return this.fatturaRepository.save(nuovaFattura);
  }

  findAll() {
    return this.fatturaRepository.find({
      relations: ['cliente', 'commessa'], // Scarichiamo anche i dati collegati
    });
  }

  findOne(id: number) {
    return this.fatturaRepository.findOne({
      where: { id },
      relations: ['cliente', 'commessa'],
    });
  }

  update(id: number, updateDto: UpdateFatturaDto) {
    return this.fatturaRepository.update(id, updateDto);
  }

  remove(id: number) {
    return this.fatturaRepository.delete(id);
  }
}
