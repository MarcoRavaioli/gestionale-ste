import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateCollaboratoreDto } from './dto/create-collaboratore.dto';
import { UpdateCollaboratoreDto } from './dto/update-collaboratore.dto';
import { Collaboratore } from '../entities/collaboratore.entity';

@Injectable()
export class CollaboratoreService implements OnModuleInit {
  constructor(
    @InjectRepository(Collaboratore)
    private readonly collaboratoreRepository: Repository<Collaboratore>,
  ) {}

  // --- ESEGUITO ALL'AVVIO DEL SERVER ---
  async onModuleInit() {
    await this.seedUsers();
  }

  async seedUsers() {
    // 1. ADMIN (Marco)
    const adminNick = 'marco123';
    const adminEsiste = await this.findOneByNickname(adminNick);

    if (!adminEsiste) {
      console.log('⚡ Creazione ADMIN in corso...');
      // Legge dal .env, se non trova usa fallback 'admin123'
      const pass = process.env.ADMIN_PASSWORD || 'admin123';
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(pass, salt);

      const admin = this.collaboratoreRepository.create({
        nome: 'Marco',
        cognome: 'Ravaioli',
        nickname: adminNick,
        password: hash,
        ruolo: 'ADMIN',
        email: 'admin@gs.it', // Opzionale
      });
      await this.collaboratoreRepository.save(admin);
      console.log(`✅ ADMIN creato: ${adminNick}`);
    }

    // 2. MANAGER (Stefano)
    const managerNick = 'Stefano03';
    const managerEsiste = await this.findOneByNickname(managerNick);

    if (!managerEsiste) {
      console.log('⚡ Creazione MANAGER in corso...');
      const pass = process.env.MANAGER_PASSWORD || 'stefano123';
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(pass, salt);

      const manager = this.collaboratoreRepository.create({
        nome: 'Stefano',
        cognome: 'Socio',
        nickname: managerNick,
        password: hash,
        ruolo: 'MANAGER',
      });
      await this.collaboratoreRepository.save(manager);
      console.log(`✅ MANAGER creato: ${managerNick}`);
    }
  }
  // ----------------------------------------------------

  async create(createDto: CreateCollaboratoreDto) {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createDto.password, salt);

    const nuovoCollaboratore = this.collaboratoreRepository.create({
      ...createDto,
      password: passwordHash,
    });

    return this.collaboratoreRepository.save(nuovoCollaboratore);
  }

  async findOneByNickname(nickname: string): Promise<Collaboratore | null> {
    return this.collaboratoreRepository
      .createQueryBuilder('collaboratore')
      .where('collaboratore.nickname = :nickname', { nickname })
      .addSelect('collaboratore.password')
      .getOne();
  }

  // Helper legacy, se servisse ancora in futuro
  async findOneByEmail(email: string): Promise<Collaboratore | null> {
    return this.collaboratoreRepository.findOneBy({ email });
  }

  findAll() {
    return this.collaboratoreRepository.find();
  }

  findOne(id: number) {
    return this.collaboratoreRepository.findOneBy({ id });
  }

  async update(id: number, updateDto: UpdateCollaboratoreDto) {
    // Se stiamo aggiornando la password, dobbiamo hasharla di nuovo!
    if (updateDto.password) {
      const salt = await bcrypt.genSalt();
      updateDto.password = await bcrypt.hash(updateDto.password, salt);
    }

    // Eseguiamo l'update
    await this.collaboratoreRepository.update(id, updateDto);

    // Ritorniamo l'utente aggiornato (senza password)
    return this.findOne(id);
  }

  remove(id: number) {
    return this.collaboratoreRepository.delete(id);
  }
}
