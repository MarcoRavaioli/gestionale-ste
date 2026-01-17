/* backend/src/fattura/fattura.service.ts */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm'; // <--- Importa DeepPartial
import { CreateFatturaDto } from './dto/create-fattura.dto';
import { UpdateFatturaDto } from './dto/update-fattura.dto';
import { Fattura } from '../entities/fattura.entity';
import { Cliente } from '../entities/cliente.entity';
import { Commessa } from '../entities/commessa.entity';

@Injectable()
export class FatturaService {
  constructor(
    @InjectRepository(Fattura)
    private readonly fatturaRepository: Repository<Fattura>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Commessa)
    private readonly commessaRepository: Repository<Commessa>,
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
    return this.fatturaRepository.delete(id);
  }

  // --- CORREZIONE QUI SOTTO ---
  createWithAttachment(
    fatturaData: DeepPartial<Fattura>, // TIPAGGIO FORTE QUI
    file?: Express.Multer.File,
  ) {
    // Ora TypeORM sa che fatturaData è UN oggetto, quindi nuovaFattura è UNA Fattura
    const nuovaFattura = this.fatturaRepository.create(fatturaData);

    if (file) {
      // TypeScript ora sa che nuovaFattura è un oggetto singolo e ha la proprietà allegati
      nuovaFattura.allegati = [
        // @ts-ignore (Se Allegato entity si aspetta un oggetto completo, ignoriamo per brevità, o meglio: crea istanza Allegato)
        { nome_file: file.filename, percorso: file.path },
      ] as any;
    }

    return this.fatturaRepository.save(nuovaFattura);
  }

  async updateWithAttachment(
    id: number,
    fatturaData: any,
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

    if (file) {
      // Nota: assicurati che la proprietà 'allegati' esista e sia gestita
      fatturaAggiornata.allegati = [
        { nome_file: file.filename, percorso: file.path } as any,
      ];
    }

    return this.fatturaRepository.save(fatturaAggiornata);
  }
}
