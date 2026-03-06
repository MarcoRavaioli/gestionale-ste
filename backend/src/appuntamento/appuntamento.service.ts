import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateAppuntamentoDto } from './dto/create-appuntamento.dto';
import { Appuntamento } from '../entities/appuntamento.entity';

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

  async findPaginated(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;

    const query = this.appuntamentoRepository
      .createQueryBuilder('appuntamento')
      .leftJoinAndSelect('appuntamento.cliente', 'cliente')
      .leftJoinAndSelect('appuntamento.indirizzo', 'indirizzo')
      .leftJoinAndSelect('indirizzo.cliente', 'indirizzoCliente')
      .leftJoinAndSelect('appuntamento.commessa', 'commessa')
      .leftJoinAndSelect('commessa.cliente', 'commessaCliente')
      .leftJoinAndSelect('commessa.indirizzo', 'commessaIndirizzo')
      .leftJoinAndSelect(
        'commessaIndirizzo.cliente',
        'commessaIndirizzoCliente',
      );

    if (search) {
      query.where(
        'appuntamento.titolo ILIKE :search OR appuntamento.descrizione ILIKE :search OR cliente.nome ILIKE :search OR indirizzoCliente.nome ILIKE :search OR commessa.descrizione ILIKE :search OR commessaCliente.nome ILIKE :search OR commessaIndirizzoCliente.nome ILIKE :search',
        { search: `%${search}%` },
      );
    }

    query.orderBy('appuntamento.id', 'DESC').skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  remove(id: number) {
    return this.appuntamentoRepository.softDelete(id);
  }
}
