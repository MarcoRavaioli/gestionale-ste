import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { CreateAllegatoDto } from './dto/create-allegato.dto';
import { Allegato } from '../entities/allegato.entity';
import { Commessa } from '../entities/commessa.entity';
import { Cliente } from '../entities/cliente.entity';
import { Indirizzo } from '../entities/indirizzo.entity';
import { Appuntamento } from '../entities/appuntamento.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AllegatoService {
  constructor(
    @InjectRepository(Allegato)
    private readonly allegatoRepository: Repository<Allegato>,
    @InjectRepository(Commessa)
    private readonly commessaRepository: Repository<Commessa>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Indirizzo)
    private readonly indirizzoRepository: Repository<Indirizzo>,
    @InjectRepository(Appuntamento)
    private readonly appuntamentoRepository: Repository<Appuntamento>,
  ) {}

  async uploadFile(createDto: CreateAllegatoDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nessun file caricato');
    }

    let entityRef: Partial<Allegato> = {};
    let prefixName = 'generale';

    try {
      if (createDto.commessaId) {
        const commessa = await this.commessaRepository.findOneBy({
          id: createDto.commessaId,
        });
        if (!commessa)
          throw new NotFoundException(
            `Commessa ID ${createDto.commessaId} non trovata`,
          );
        entityRef.commessa = commessa;
        prefixName = `commessa_${commessa.id}`;
      } else if (createDto.clienteId) {
        const cliente = await this.clienteRepository.findOneBy({
          id: createDto.clienteId,
        });
        if (!cliente)
          throw new NotFoundException(
            `Cliente ID ${createDto.clienteId} non trovato`,
          );
        entityRef.cliente = cliente;
        prefixName = `cliente_${cliente.id}`;
      } else if (createDto.indirizzoId) {
        const indirizzo = await this.indirizzoRepository.findOneBy({
          id: createDto.indirizzoId,
        });
        if (!indirizzo)
          throw new NotFoundException(
            `Indirizzo ID ${createDto.indirizzoId} non trovato`,
          );
        entityRef.indirizzo = indirizzo;
        prefixName = `indirizzo_${indirizzo.id}`;
      } else if (createDto.appuntamentoId) {
        const appuntamento = await this.appuntamentoRepository.findOneBy({
          id: createDto.appuntamentoId,
        });
        if (!appuntamento)
          throw new NotFoundException(
            `Appuntamento ID ${createDto.appuntamentoId} non trovato`,
          );
        entityRef.appuntamento = appuntamento;
        prefixName = `appuntamento_${appuntamento.id}`;
      }
    } catch (error) {
      // Puliamo il file orfano
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw error;
    }

    // --- Smart Renaming ---
    const estensione = path.extname(file.originalname);
    const nomeBase = path
      .basename(file.originalname, estensione)
      .replace(/[^a-zA-Z0-9_\-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);

    const nuovoNome = `${prefixName}_${nomeBase}_${uniqueSuffix}${estensione}`;
    const nuovoPercorso = path.join(path.dirname(file.path), nuovoNome);

    // Rinomina fisicamente il file
    fs.renameSync(file.path, nuovoPercorso);

    const nuovoAllegato = this.allegatoRepository.create({
      nome_file: nuovoNome,
      percorso: nuovoPercorso,
      tipo_file: file.mimetype,
      ...entityRef,
    });

    return this.allegatoRepository.save(nuovoAllegato);
  }

  async findPaginated(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;

    const query = this.allegatoRepository
      .createQueryBuilder('allegato')
      .leftJoinAndSelect('allegato.commessa', 'commessa')
      .leftJoinAndSelect('allegato.cliente', 'cliente')
      .leftJoinAndSelect('allegato.indirizzo', 'indirizzo')
      .leftJoinAndSelect('allegato.appuntamento', 'appuntamento');

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('allegato.nome_file ILIKE :search', {
            search: `%${search}%`,
          })
            .orWhere('commessa.seriale ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('commessa.descrizione ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('cliente.nome ILIKE :search', { search: `%${search}%` })
            .orWhere('indirizzo.via ILIKE :search', { search: `%${search}%` })
            .orWhere('indirizzo.citta ILIKE :search', { search: `%${search}%` })
            .orWhere('appuntamento.titolo ILIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    query.orderBy('allegato.data_caricamento', 'DESC').skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findAll() {
    return this.allegatoRepository.find({
      relations: ['commessa', 'cliente', 'indirizzo', 'appuntamento'],
    });
  }

  async findOne(id: number) {
    const allegato = await this.allegatoRepository.findOne({
      where: { id },
      relations: ['commessa', 'cliente', 'indirizzo', 'appuntamento'],
    });
    if (!allegato) throw new NotFoundException(`Allegato #${id} non trovato`);
    return allegato;
  }

  // --- Cancellazione Logica + Fisica ---
  async remove(id: number) {
    const allegato = await this.findOne(id);

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
    }

    // 2. Rimuovi il record dal DB (HARD DELETE)
    await this.allegatoRepository.delete(id);
    return { success: true, message: 'Allegato eliminato fisicamente' };
  }
}
