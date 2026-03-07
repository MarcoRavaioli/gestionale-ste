import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { CreateCommessaDto } from './dto/create-commessa.dto';
import { Commessa } from '../entities/commessa.entity';
import { UpdateCommessaDto } from './dto/update-commessa.dto';

@Injectable()
export class CommessaService {
  constructor(
    @InjectRepository(Commessa)
    private readonly commessaRepository: Repository<Commessa>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateCommessaDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const nuovaCommessa = queryRunner.manager.create(
        Commessa,
        createDto as any,
      );
      const savedCommessa = await queryRunner.manager.save(
        Commessa,
        nuovaCommessa,
      );
      await queryRunner.commitTransaction();
      return savedCommessa;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        'Errore durante la creazione della commessa. Transazione annullata.',
        err.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.commessaRepository.find({
      relations: [
        'indirizzo',
        'indirizzo.cliente',
        'cliente', // <--- FASE 2: Estrae il cliente se la commessa è diretta
        'allegati',
      ],
      order: { id: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.commessaRepository.findOne({
      where: { id },
      relations: [
        'indirizzo',
        'indirizzo.cliente',
        'cliente', // <--- FASE 2: Estrae il cliente diretto
        'appuntamenti',
        'allegati',
        'fatture',
      ],
    });
  }

  async update(id: number, updateDto: UpdateCommessaDto) {
    const datiPuliti: Partial<UpdateCommessaDto> = { ...updateDto };

    if ('appuntamenti' in datiPuliti) delete datiPuliti.appuntamenti;
    if ('fatture' in datiPuliti) delete datiPuliti.fatture;
    if ('allegati' in datiPuliti) delete datiPuliti.allegati;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Commessa, id, datiPuliti);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Errore durante l'aggiornamento della commessa. Transazione annullata.",
        err.message,
      );
    } finally {
      await queryRunner.release();
    }

    return this.findOne(id);
  }

  async findPaginated(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;

    const query = this.commessaRepository
      .createQueryBuilder('commessa')
      .leftJoinAndSelect('commessa.cliente', 'cliente')
      .leftJoinAndSelect('commessa.indirizzo', 'indirizzo')
      .leftJoinAndSelect('indirizzo.cliente', 'indirizzoCliente');

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('commessa.seriale ILIKE :search', { search: `%${search}%` })
            .orWhere('commessa.descrizione ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('cliente.nome ILIKE :search', { search: `%${search}%` })
            .orWhere('indirizzoCliente.nome ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('indirizzo.via ILIKE :search', { search: `%${search}%` })
            .orWhere('indirizzo.citta ILIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    query.orderBy('commessa.id', 'DESC').skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async remove(id: number, cascade: boolean = false) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const commessa = await queryRunner.manager.findOne(Commessa, {
        where: { id },
        relations: ['appuntamenti', 'fatture', 'allegati'],
      });

      if (!commessa) {
        throw new InternalServerErrorException('Commessa non trovata');
      }

      if (cascade) {
        if (commessa.appuntamenti?.length)
          await queryRunner.manager.softRemove(commessa.appuntamenti);
        if (commessa.fatture?.length)
          await queryRunner.manager.softRemove(commessa.fatture);
        if (commessa.allegati?.length)
          await queryRunner.manager.softRemove(commessa.allegati);
      } else {
        // Orphan
        if (commessa.appuntamenti?.length) {
          commessa.appuntamenti.forEach((a) => (a.commessa = null as any));
          await queryRunner.manager.save(commessa.appuntamenti);
        }
        if (commessa.fatture?.length) {
          commessa.fatture.forEach((f) => (f.commessa = null as any));
          await queryRunner.manager.save(commessa.fatture);
        }
        if (commessa.allegati?.length) {
          commessa.allegati.forEach((al) => (al.commessa = null as any));
          await queryRunner.manager.save(commessa.allegati);
        }
      }

      await queryRunner.manager.softRemove(commessa);
      await queryRunner.commitTransaction();
      return { success: true, message: 'Commessa eliminata', cascade };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Errore durante l'eliminazione della commessa.",
        err.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
