import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAllegatoDto } from './dto/create-allegato.dto';
import { Allegato } from '../entities/allegato.entity';
import { Commessa } from '../entities/commessa.entity';
import * as fs from 'fs'; // Importante per gestire i file fisici

@Injectable()
export class AllegatoService {
  constructor(
    @InjectRepository(Allegato)
    private readonly allegatoRepository: Repository<Allegato>,
    @InjectRepository(Commessa)
    private readonly commessaRepository: Repository<Commessa>,
  ) {}

  async uploadFile(createDto: CreateAllegatoDto, file: Express.Multer.File) {
    // 1. Verifichiamo che la commessa esista
    const commessa = await this.commessaRepository.findOneBy({
      id: createDto.commessaId,
    });

    if (!commessa) {
      // Se il file è stato caricato da Multer ma la commessa non esiste, puliamo il file orfano
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new NotFoundException(
        `Commessa ID ${createDto.commessaId} non trovata`,
      );
    }

    // 2. Creiamo il record nel DB
    const nuovoAllegato = this.allegatoRepository.create({
      nome_file: file.originalname,
      percorso: file.path,
      tipo_file: file.mimetype,
      commessa: commessa,
    });

    return this.allegatoRepository.save(nuovoAllegato);
  }

  findAll() {
    return this.allegatoRepository.find({ relations: ['commessa'] });
  }

  async findOne(id: number) {
    const allegato = await this.allegatoRepository.findOne({
      where: { id },
      relations: ['commessa'],
    });
    if (!allegato) throw new NotFoundException(`Allegato #${id} non trovato`);
    return allegato;
  }

  // --- NUOVO: Cancellazione Logica + Fisica ---
  async remove(id: number) {
    const allegato = await this.findOne(id); // Usa findOne per avere il controllo errori

    // 1. Rimuovi il file fisico dal disco
    try {
      if (fs.existsSync(allegato.percorso)) {
        fs.unlinkSync(allegato.percorso);
      }
    } catch (err) {
      console.error(
        `Errore durante la rimozione del file ${allegato.percorso}:`,
        err,
      );
      // Continuiamo comunque per rimuovere il record dal DB
    }

    // 2. Rimuovi il record dal DB
    return this.allegatoRepository.remove(allegato);
  }
}
