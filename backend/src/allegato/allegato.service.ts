import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAllegatoDto } from './dto/create-allegato.dto';
import { Allegato } from '../entities/allegato.entity';
import { Commessa } from '../entities/commessa.entity';

@Injectable()
export class AllegatoService {
  constructor(
    @InjectRepository(Allegato)
    private readonly allegatoRepository: Repository<Allegato>,
    @InjectRepository(Commessa)
    private readonly commessaRepository: Repository<Commessa>,
  ) {}

  // Qui riceviamo anche l'oggetto 'file' che NestJS ha processato
  async uploadFile(createDto: CreateAllegatoDto, file: Express.Multer.File) {
    const commessa = await this.commessaRepository.findOneBy({
      id: createDto.commessaId,
    });
    if (!commessa) {
      throw new NotFoundException(
        `Commessa ID ${createDto.commessaId} non trovata`,
      );
    }

    const nuovoAllegato = this.allegatoRepository.create({
      nome_file: file.originalname, // Nome originale (es. preventivo.pdf)
      percorso: file.path, // Dove è finito (es. uploads/a3f12...pdf)
      tipo_file: file.mimetype, // Tipo (application/pdf)
      commessa: commessa,
    });

    return this.allegatoRepository.save(nuovoAllegato);
  }

  findAll() {
    return this.allegatoRepository.find({ relations: ['commessa'] });
  }

  // Aggiungi remove() per cancellare anche il file fisico se vuoi fare i compiti a casa perfetti!
}
