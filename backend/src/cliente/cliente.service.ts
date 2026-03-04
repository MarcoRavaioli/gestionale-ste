import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
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
    const nuovoCliente = this.clienteRepository.create(createClienteDto);
    return this.clienteRepository.save(nuovoCliente);
  }

  findAll() {
    return this.clienteRepository.find({
      relations: [
        'indirizzi',
        'indirizzi.commesse',
        'indirizzi.commesse.appuntamenti',
        'commesse',     // <--- FASE 2: Commesse dirette del cliente
        'appuntamenti', // <--- FASE 2: Appuntamenti diretti del cliente
      ],
    });
  }

  findOne(id: number) {
    return this.clienteRepository.findOne({
      where: { id },
      relations: [
        // Ramo standard: Cliente -> Cantiere -> Commessa -> App/All
        'indirizzi',
        'indirizzi.commesse',
        'indirizzi.commesse.appuntamenti',
        'indirizzi.commesse.allegati',
        // Nuovi rami diretti
        'commesse',               // Commesse slegate da cantiere
        'commesse.appuntamenti',  // Appuntamenti di commesse slegate
        'appuntamenti',           // Appuntamenti isolati solo col cliente
        'allegati',               // Allegati generali del cliente
      ],
    });
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    await this.clienteRepository.update(id, updateClienteDto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.clienteRepository.softDelete(id);
  }

  async findPaginated(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;
    
    // Costruiamo la condizione di ricerca: Cerca in nome OPPURE in email
    const whereCondition = search ? [
      { nome: ILike(`%${search}%`) },
      { email: ILike(`%${search}%`) }
    ] : {};

    // findAndCount esegue 2 query ottimizzate in parallelo: una tira fuori i 20 record, l'altra conta il totale assoluto nel DB
    const [data, total] = await this.clienteRepository.findAndCount({
      where: whereCondition,
      order: { nome: 'ASC' }, // Ordiniamo alfabeticamente
      skip: skip,
      take: limit,
      // Se vuoi mostrare dei counter nell'HTML dell'archivio, puoi decommentare le relations
      // relations: ['indirizzi', 'commesse', 'appuntamenti'] 
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}