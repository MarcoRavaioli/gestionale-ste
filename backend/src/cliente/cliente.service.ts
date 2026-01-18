import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from '../entities/cliente.entity';

@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  create(createClienteDto: CreateClienteDto) {
    // Crea l'oggetto ma non lo salva ancora
    const nuovoCliente = this.clienteRepository.create(createClienteDto);
    // Lo salva nel DB
    return this.clienteRepository.save(nuovoCliente);
  }

  findAll() {
    return this.clienteRepository.find({
      relations: [
        'indirizzi',
        'indirizzi.commesse',
        'indirizzi.commesse.appuntamenti',
      ],
    });
  }

  findOne(id: number) {
    return this.clienteRepository.findOne({
      where: { id },
      // ANCHE QUI, carica a cascata: Cliente -> Indirizzi -> Commesse
      relations: [
        'indirizzi',
        'indirizzi.commesse',
        'indirizzi.commesse.appuntamenti',
        'indirizzi.commesse.allegati',
      ],
    });
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    await this.clienteRepository.update(id, updateClienteDto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.clienteRepository.delete(id);
  }
}
