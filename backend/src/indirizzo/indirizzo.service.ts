import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { CreateIndirizzoDto } from './dto/create-indirizzo.dto';
import { UpdateIndirizzoDto } from './dto/update-indirizzo.dto';
import { Indirizzo } from '../entities/indirizzo.entity';
import { Allegato } from '../entities/allegato.entity';
import * as fs from 'fs';

@Injectable()
export class IndirizzoService {
  constructor(
    @InjectRepository(Indirizzo)
    private readonly indirizzoRepository: Repository<Indirizzo>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateIndirizzoDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const nuovoIndirizzo = queryRunner.manager.create(
        Indirizzo,
        createDto as any,
      );
      const savedIndirizzo = await queryRunner.manager.save(
        Indirizzo,
        nuovoIndirizzo,
      );
      await queryRunner.commitTransaction();
      return savedIndirizzo;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Errore durante la creazione dell'indirizzo. Transazione annullata.",
        err.message,
      );
    } finally {
      await queryRunner.release();
    }
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

  async update(id: number, updateDto: UpdateIndirizzoDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Indirizzo, id, updateDto as any);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Errore durante l'aggiornamento dell'indirizzo. Transazione annullata.",
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
      const indirizzo = await queryRunner.manager.findOne(Indirizzo, {
        where: { id },
        relations: ['commesse', 'appuntamenti', 'allegati'],
      });

      if (!indirizzo) {
        throw new InternalServerErrorException('Indirizzo non trovato');
      }

      if (cascade) {
        if (indirizzo.commesse?.length)
          await queryRunner.manager.softRemove(indirizzo.commesse);
        if (indirizzo.appuntamenti?.length)
          await queryRunner.manager.softRemove(indirizzo.appuntamenti);
        if (indirizzo.allegati?.length) {
          await queryRunner.manager.remove(indirizzo.allegati);
        }
      } else {
        // Orphan
        if (indirizzo.commesse?.length) {
          indirizzo.commesse.forEach((c) => (c.indirizzo = null as any));
          await queryRunner.manager.save(indirizzo.commesse);
        }
        if (indirizzo.appuntamenti?.length) {
          indirizzo.appuntamenti.forEach((a) => (a.indirizzo = null as any));
          await queryRunner.manager.save(indirizzo.appuntamenti);
        }
        if (indirizzo.allegati?.length) {
          indirizzo.allegati.forEach((al) => (al.indirizzo = null as any));
          await queryRunner.manager.save(indirizzo.allegati);
        }
      }

      await queryRunner.manager.softRemove(indirizzo);
      await queryRunner.commitTransaction();
      return { success: true, message: 'Indirizzo eliminato', cascade };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Errore durante l'eliminazione dell'indirizzo.",
        err.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findPaginated(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;

    const query = this.indirizzoRepository
      .createQueryBuilder('indirizzo')
      .leftJoinAndSelect('indirizzo.cliente', 'cliente'); // Carica anche il cliente per l'interfaccia

    // Ricerca flessibile: cerca nella via, nella città, o nel nome del cliente
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('indirizzo.via ILIKE :search', { search: `%${search}%` })
            .orWhere('indirizzo.citta ILIKE :search', { search: `%${search}%` })
            .orWhere('cliente.nome ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    query
      .orderBy('indirizzo.citta', 'ASC') // Ordine di default
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
