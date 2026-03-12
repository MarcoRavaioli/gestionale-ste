import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { CreateAppuntamentoDto } from './dto/create-appuntamento.dto';
import { Appuntamento } from '../entities/appuntamento.entity';
import { Allegato } from '../entities/allegato.entity';
import * as fs from 'fs';

@Injectable()
export class AppuntamentoService {
  constructor(
    @InjectRepository(Appuntamento)
    private readonly appuntamentoRepository: Repository<Appuntamento>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateAppuntamentoDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const nuovoApp = queryRunner.manager.create(
        Appuntamento,
        createDto as any,
      );
      const savedApp = await queryRunner.manager.save(Appuntamento, nuovoApp);
      await queryRunner.commitTransaction();
      return savedApp;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Errore durante la creazione dell'appuntamento. Transazione annullata.",
        err.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.appuntamentoRepository.find({
      relations: [
        'commessa',
        'commessa.indirizzo',
        'commessa.indirizzo.cliente',
        'commessa.cliente', // Nel caso in cui la commessa sia diretta
        'indirizzo', // Appuntamento diretto al cantiere
        'indirizzo.cliente', // Cliente del cantiere diretto
        'cliente', // Appuntamento diretto al cliente
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

  async update(id: number, updateDto: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Appuntamento, id, updateDto);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Errore l'aggiornamento dell'appuntamento. Transazione annullata.",
        err.message,
      );
    } finally {
      await queryRunner.release();
    }

    return this.findOne(id);
  }

  async findPaginated(
    page: number,
    limit: number,
    search: string,
    orderBy: string = 'id',
    orderDirection: 'ASC' | 'DESC' = 'DESC',
  ) {
    const skip = (page - 1) * limit;

    const allowedOrderFields = ['id', 'titolo', 'data_ora', 'descrizione'];
    const safeOrderBy = allowedOrderFields.includes(orderBy) ? orderBy : 'id';

    const query = this.appuntamentoRepository
      .createQueryBuilder('appuntamento')
      // Join diretti
      .leftJoinAndSelect('appuntamento.cliente', 'cliente')
      .leftJoinAndSelect('appuntamento.indirizzo', 'indirizzo')
      .leftJoinAndSelect('appuntamento.commessa', 'commessa')
      // Join tramite Indirizzo (Cantiere)
      .leftJoinAndSelect('indirizzo.cliente', 'indirizzoCliente')
      // Join tramite Commessa
      .leftJoinAndSelect('commessa.cliente', 'commessaCliente')
      .leftJoinAndSelect('commessa.indirizzo', 'commessaIndirizzo')
      .leftJoinAndSelect(
        'commessaIndirizzo.cliente',
        'commessaIndirizzoCliente',
      );

    if (search) {
      const searchTerm = `%${search}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('appuntamento.nome ILIKE :search', { search: searchTerm })
            .orWhere('appuntamento.descrizione ILIKE :search', { search: searchTerm })
            // Cliente (tutte le vie)
            .orWhere('cliente.nome ILIKE :search', { search: searchTerm })
            .orWhere('cliente.email ILIKE :search', { search: searchTerm })
            .orWhere('indirizzoCliente.nome ILIKE :search', { search: searchTerm })
            .orWhere('commessaCliente.nome ILIKE :search', { search: searchTerm })
            .orWhere('commessaIndirizzoCliente.nome ILIKE :search', { search: searchTerm })
            // Cantiere / Indirizzo (tutte le vie)
            .orWhere('indirizzo.via ILIKE :search', { search: searchTerm })
            .orWhere('indirizzo.citta ILIKE :search', { search: searchTerm })
            .orWhere('indirizzo.provincia ILIKE :search', { search: searchTerm })
            .orWhere('commessaIndirizzo.via ILIKE :search', { search: searchTerm })
            .orWhere('commessaIndirizzo.citta ILIKE :search', { search: searchTerm })
            // Commessa
            .orWhere('commessa.seriale ILIKE :search', { search: searchTerm })
            .orWhere('commessa.descrizione ILIKE :search', { search: searchTerm });
        }),
      );
    }

    query.orderBy(`appuntamento.${safeOrderBy}`, orderDirection).skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async remove(id: number) {
    const appuntamento = await this.appuntamentoRepository.findOne({
      where: { id },
      relations: ['allegati'],
    });

    if (!appuntamento) {
      throw new InternalServerErrorException('Appuntamento non trovato');
    }

    if (appuntamento.allegati?.length) {
      await this.dataSource.manager.remove(appuntamento.allegati);
    }

    return this.appuntamentoRepository.softRemove(appuntamento);
  }
}
