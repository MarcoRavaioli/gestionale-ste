import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'; // <--- Importa bcrypt
import { CreateCollaboratoreDto } from './dto/create-collaboratore.dto';
import { UpdateCollaboratoreDto } from './dto/update-collaboratore.dto';
import { Collaboratore } from '../entities/collaboratore.entity';

@Injectable()
export class CollaboratoreService {
  constructor(
    @InjectRepository(Collaboratore)
    private readonly collaboratoreRepository: Repository<Collaboratore>,
  ) {}

  async create(createDto: CreateCollaboratoreDto) {
    // 1. Generiamo il "Sale" e l'Hash della password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createDto.password, salt);

    // 2. Creiamo l'utente sostituendo la password in chiaro con l'hash
    const nuovoCollaboratore = this.collaboratoreRepository.create({
      ...createDto,
      password: passwordHash, // <--- Salviamo l'hash!
    });

    return this.collaboratoreRepository.save(nuovoCollaboratore);
  }

  // Aggiungi questo metodo helper: ci servirà per il login
  async findOneByEmail(email: string): Promise<Collaboratore | null> {
    // Dobbiamo usare addSelect('password') perché nell'entity abbiamo messo select: false
    return this.collaboratoreRepository
      .createQueryBuilder('collaboratore')
      .where('collaboratore.email = :email', { email })
      .addSelect('collaboratore.password')
      .getOne();
  }

  findAll() {
    return this.collaboratoreRepository.find();
  }

  findOne(id: number) {
    return this.collaboratoreRepository.findOneBy({ id });
  }

  update(id: number, updateDto: UpdateCollaboratoreDto) {
    return this.collaboratoreRepository.update(id, updateDto);
  }

  remove(id: number) {
    return this.collaboratoreRepository.delete(id);
  }
}
