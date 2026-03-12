/* backend/src/fattura/fattura.service.ts */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, In } from 'typeorm';
import { CreateFatturaDto } from './dto/create-fattura.dto';
import { UpdateFatturaDto } from './dto/update-fattura.dto';
import { Fattura } from '../entities/fattura.entity';
import { Cliente } from '../entities/cliente.entity';
import { Commessa } from '../entities/commessa.entity';
import { Allegato } from '../entities/allegato.entity';

@Injectable()
export class FatturaService {
  constructor(
    @InjectRepository(Fattura)
    private readonly fatturaRepository: Repository<Fattura>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Commessa)
    private readonly commessaRepository: Repository<Commessa>,
    @InjectRepository(Allegato)
    private readonly allegatoRepository: Repository<Allegato>,
  ) {}

  // ... (gli altri metodi create, findAll, etc. rimangono uguali)

  async create(createDto: CreateFatturaDto) {
    const queryRunner = this.fatturaRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let cliente: Cliente | null = null;
      if (createDto.clienteId) {
        cliente = await queryRunner.manager.findOne(Cliente, {
          where: { id: createDto.clienteId },
        });
        if (!cliente) {
          throw new NotFoundException(
            `Cliente con ID ${createDto.clienteId} non trovato`,
          );
        }
      }

      let commesse: Commessa[] = [];
      if (createDto.commessa_ids && createDto.commessa_ids.length > 0) {
        commesse = await queryRunner.manager.findBy(Commessa, {
          id: In(createDto.commessa_ids),
        });
        if (commesse.length !== createDto.commessa_ids.length) {
          throw new NotFoundException('Una o più commesse non trovate');
        }
      }

      const nuovaFattura = queryRunner.manager.create(Fattura, {
        ...createDto,
        cliente: cliente,
        commesse: commesse,
      });

      const savedFattura = await queryRunner.manager.save(nuovaFattura);

      // Chiudo le commesse collegate
      if (commesse.length > 0) {
        for (const commessa of commesse) {
          commessa.stato = 'CHIUSA';
          await queryRunner.manager.save(commessa);
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedFattura.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.fatturaRepository.find({
      relations: ['cliente', 'commesse', 'allegati'],
      order: { data_emissione: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.fatturaRepository.findOne({
      where: { id },
      relations: ['cliente', 'commesse', 'commesse.indirizzo'],
    });
  }

  async update(id: number, updateDto: UpdateFatturaDto) {
    const queryRunner = this.fatturaRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fattura = await queryRunner.manager.findOne(Fattura, {
        where: { id },
        relations: ['commesse'],
      });
      if (!fattura) throw new NotFoundException('Fattura non trovata');

      if (updateDto.clienteId) {
        const cliente = await queryRunner.manager.findOne(Cliente, {
          where: { id: updateDto.clienteId },
        });
        if (!cliente) throw new NotFoundException('Cliente non trovato');
        fattura.cliente = cliente;
      }

      if (updateDto.commessa_ids) {
        const commesse = await queryRunner.manager.findBy(Commessa, {
          id: In(updateDto.commessa_ids),
        });
        if (commesse.length !== updateDto.commessa_ids.length) {
          throw new NotFoundException('Una o più commesse non trovate');
        }
        fattura.commesse = commesse;

        // Chiudo le nuove commesse collegate
        for (const commessa of commesse) {
          commessa.stato = 'CHIUSA';
          await queryRunner.manager.save(commessa);
        }
      }

      this.fatturaRepository.merge(fattura, updateDto);
      await queryRunner.manager.save(fattura);

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  remove(id: number) {
    return this.fatturaRepository.softDelete(id);
  }

  // --- CREAZIONE CON ALLEGATO OPZIONALE ---
  async createWithAttachment(
    fatturaData: DeepPartial<Fattura>,
    file?: Express.Multer.File,
  ) {
    const nuovaFattura = this.fatturaRepository.create(fatturaData);
    const savedFattura = await this.fatturaRepository.save(nuovaFattura);

    if (file) {
      const allegato = this.allegatoRepository.create({
        nome_file: file.originalname || file.filename,
        percorso: file.path,
        tipo_file: file.mimetype,
        fattura: savedFattura,
      });
      await this.allegatoRepository.save(allegato);
    }

    return this.findOne(savedFattura.id);
  }

  // --- MODIFICA CON ALLEGATO OPZIONALE ---
  async updateWithAttachment(
    id: number,
    fatturaData: DeepPartial<Fattura>,
    file?: Express.Multer.File,
  ) {
    const fatturaEsistente = await this.fatturaRepository.findOne({
      where: { id },
      relations: ['allegati'],
    });

    if (!fatturaEsistente) throw new NotFoundException('Fattura non trovata');

    const fatturaAggiornata = this.fatturaRepository.merge(
      fatturaEsistente,
      fatturaData,
    );
    await this.fatturaRepository.save(fatturaAggiornata);

    if (file) {
      const allegato = this.allegatoRepository.create({
        nome_file: file.originalname || file.filename,
        percorso: file.path,
        tipo_file: file.mimetype,
        fattura: fatturaEsistente,
      });
      await this.allegatoRepository.save(allegato);
    }

    return this.findOne(id);
  }
}
