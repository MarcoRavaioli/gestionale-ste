import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, DataSource } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from '../entities/cliente.entity';

@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createClienteDto: CreateClienteDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const nuovoCliente = queryRunner.manager.create(
        Cliente,
        createClienteDto,
      );
      const savedCliente = await queryRunner.manager.save(
        Cliente,
        nuovoCliente,
      );
      await queryRunner.commitTransaction();
      return savedCliente;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        'Errore durante il salvataggio del cliente. Transazione annullata.',
        err.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.clienteRepository.find({
      relations: [
        'indirizzi',
        'indirizzi.commesse',
        'indirizzi.commesse.appuntamenti',
        'commesse', // <--- FASE 2: Commesse dirette del cliente
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
        'commesse', // Commesse slegate da cantiere
        'commesse.appuntamenti', // Appuntamenti di commesse slegate
        'appuntamenti', // Appuntamenti isolati solo col cliente
        'allegati', // Allegati generali del cliente
      ],
    });
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Cliente, id, updateClienteDto);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Errore durante l'aggiornamento del cliente. Transazione annullata.",
        err.message,
      );
    } finally {
      await queryRunner.release();
    }

    return this.findOne(id);
  }

  async remove(id: number, cascade: boolean = false) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cliente = await queryRunner.manager.findOne(Cliente, {
        where: { id },
        relations: [
          'indirizzi',
          'commesse',
          'appuntamenti',
          'fatture',
          'allegati',
        ], // We'll adjust based on entity definition
      });

      if (!cliente) {
        throw new InternalServerErrorException('Cliente non trovato');
      }

      if (cascade) {
        if (cliente.indirizzi?.length)
          await queryRunner.manager.softRemove(cliente.indirizzi);
        if (cliente.commesse?.length)
          await queryRunner.manager.softRemove(cliente.commesse);
        if (cliente.appuntamenti?.length)
          await queryRunner.manager.softRemove(cliente.appuntamenti);
        if (cliente.fatture?.length)
          await queryRunner.manager.softRemove(cliente.fatture);
        if (cliente.allegati?.length)
          await queryRunner.manager.softRemove(cliente.allegati);
      } else {
        // Orphan
        if (cliente.indirizzi?.length) {
          cliente.indirizzi.forEach((i) => (i.cliente = null as any));
          await queryRunner.manager.save(cliente.indirizzi);
        }
        if (cliente.commesse?.length) {
          cliente.commesse.forEach((c) => (c.cliente = null as any));
          await queryRunner.manager.save(cliente.commesse);
        }
        if (cliente.appuntamenti?.length) {
          cliente.appuntamenti.forEach((a) => (a.cliente = null as any));
          await queryRunner.manager.save(cliente.appuntamenti);
        }
        if (cliente.fatture?.length) {
          cliente.fatture.forEach((f) => (f.cliente = null as any));
          await queryRunner.manager.save(cliente.fatture);
        }
        if (cliente.allegati?.length) {
          cliente.allegati.forEach((al) => (al.cliente = null as any));
          await queryRunner.manager.save(cliente.allegati);
        }
      }

      await queryRunner.manager.softRemove(cliente);
      await queryRunner.commitTransaction();
      return { success: true, message: 'Cliente eliminato', cascade };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Errore durante l'eliminazione del cliente.",
        err.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findPaginated(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;

    // Costruiamo la condizione di ricerca: Cerca in nome OPPURE in email
    const whereCondition = search
      ? [{ nome: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
      : {};

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
      totalPages: Math.ceil(total / limit),
    };
  }
}
