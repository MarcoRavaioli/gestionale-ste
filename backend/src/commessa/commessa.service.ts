import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommessaDto } from './dto/create-commessa.dto';
import { UpdateCommessaDto } from './dto/update-commessa.dto'; // Assicurati di importare questo!
import { Commessa } from '../entities/commessa.entity';
import { Cliente } from '../entities/cliente.entity';

@Injectable()
export class CommessaService {
  constructor(
    @InjectRepository(Commessa)
    private readonly commessaRepository: Repository<Commessa>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  // CREAZIONE
  async create(createDto: CreateCommessaDto) {
    const clienteTrovato = await this.clienteRepository.findOneBy({
      id: createDto.clienteId,
    });

    if (!clienteTrovato) {
      throw new NotFoundException(
        `Cliente con ID ${createDto.clienteId} non trovato`,
      );
    }

    const nuovaCommessa = this.commessaRepository.create({
      seriale: createDto.seriale,
      descrizione: createDto.descrizione,
      stato: createDto.stato || 'APERTA',
      cliente: clienteTrovato,
    });

    return this.commessaRepository.save(nuovaCommessa);
  }

  // LISTA COMPLETA
  findAll() {
    return this.commessaRepository.find({
      relations: ['cliente'],
    });
  }

  // CERCA UNA SINGOLA COMMESSA (Mancava questo!)
  findOne(id: number) {
    return this.commessaRepository.findOne({
      where: { id },
      relations: ['cliente', 'appuntamenti'], // Utile vedere anche gli appuntamenti collegati
    });
  }

  // AGGIORNA (Mancava questo!)
  update(id: number, updateDto: UpdateCommessaDto) {
    return this.commessaRepository.update(id, updateDto);
  }

  // ELIMINA (Mancava questo!)
  remove(id: number) {
    return this.commessaRepository.delete(id);
  }
}
