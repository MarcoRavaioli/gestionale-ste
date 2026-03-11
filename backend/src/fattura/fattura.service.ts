/* backend/src/fattura/fattura.service.ts */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
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
    let cliente: Cliente | null = null;
    if (createDto.clienteId) {
      cliente = await this.clienteRepository.findOneBy({
        id: createDto.clienteId,
      });
      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${createDto.clienteId} non trovato`,
        );
      }
    }

    let commessa: Commessa | null = null;
    if (createDto.commessaId) {
      commessa = await this.commessaRepository.findOneBy({
        id: createDto.commessaId,
      });
      if (!commessa) {
        throw new NotFoundException(
          `Commessa con ID ${createDto.commessaId} non trovata`,
        );
      }
    }

    const nuovaFattura = this.fatturaRepository.create({
      ...createDto,
      cliente: cliente,
      commessa: commessa,
    });

    return this.fatturaRepository.save(nuovaFattura);
  }

  findAll() {
    return this.fatturaRepository.find({
      relations: ['cliente', 'commessa', 'allegati'],
      order: { data_emissione: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.fatturaRepository.findOne({
      where: { id },
      relations: ['cliente', 'commessa'],
    });
  }

  update(id: number, updateDto: UpdateFatturaDto) {
    return this.fatturaRepository.update(id, updateDto);
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
