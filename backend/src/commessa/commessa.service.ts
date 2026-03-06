import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
      query.where(
        'commessa.seriale ILIKE :search OR commessa.descrizione ILIKE :search OR cliente.nome ILIKE :search OR indirizzoCliente.nome ILIKE :search',
        { search: `%${search}%` },
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

  async remove(id: number) {
    await this.commessaRepository.softDelete(id);
    return { deleted: true };
  }
}
