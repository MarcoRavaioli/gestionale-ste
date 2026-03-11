import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from '../entities/cliente.entity';
import { Allegato } from '../entities/allegato.entity';
import * as fs from 'fs';

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
    return this.clienteRepository
      .createQueryBuilder('cliente')
      .leftJoinAndSelect('cliente.indirizzi', 'indirizzo')
      .leftJoinAndSelect('indirizzo.commesse', 'indirizzo_commessa')
      .leftJoinAndSelect('indirizzo_commessa.appuntamenti', 'indirizzo_appuntamento')
      .leftJoinAndSelect('cliente.commesse', 'commessa')
      .leftJoinAndSelect('cliente.appuntamenti', 'appuntamento')
      .getMany();
  }

  findOne(id: number) {
    return this.clienteRepository
      .createQueryBuilder('cliente')
      // Ramo standard: Cliente -> Cantiere -> Commessa -> App/All
      .leftJoinAndSelect('cliente.indirizzi', 'indirizzo')
      .leftJoinAndSelect('indirizzo.commesse', 'indirizzo_commessa')
      .leftJoinAndSelect('indirizzo_commessa.appuntamenti', 'indirizzo_appuntamento')
      .leftJoinAndSelect('indirizzo_commessa.allegati', 'indirizzo_allegato')
      // Nuovi rami diretti
      .leftJoinAndSelect('cliente.commesse', 'commessa')
      .leftJoinAndSelect('commessa.appuntamenti', 'commessa_appuntamento')
      .leftJoinAndSelect('cliente.appuntamenti', 'appuntamento')
      .leftJoinAndSelect('cliente.allegati', 'allegato')
      .where('cliente.id = :id', { id })
      .getOne();
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
        if (cliente.allegati?.length) {
          await queryRunner.manager.remove(cliente.allegati);
        }
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

  async findPaginated(
    page: number,
    limit: number,
    search: string,
    orderBy: string = 'nome',
    orderDirection: 'ASC' | 'DESC' = 'ASC',
  ) {
    const skip = (page - 1) * limit;

    // Whitelist delle colonne ordinabili (sicurezza: evita SQL injection sul campo ORDER BY)
    const allowedOrderFields = ['nome', 'email', 'telefono', 'id'];
    const safeOrderBy = allowedOrderFields.includes(orderBy) ? orderBy : 'nome';

    const query = this.clienteRepository.createQueryBuilder('cliente');

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('cliente.nome ILIKE :search', { search: `%${search}%` })
            .orWhere('cliente.telefono ILIKE :search', { search: `%${search}%` })
            .orWhere('cliente.email ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    query
      .orderBy(`cliente.${safeOrderBy}`, orderDirection)
      .skip(skip)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
