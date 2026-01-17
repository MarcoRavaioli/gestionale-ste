import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CollaboratoreService } from '../collaboratore/collaboratore.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private collaboratoreService: CollaboratoreService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // 1. Cerchiamo l'utente tramite NICKNAME (prima era email)
    // Assicurati che il tuo LoginDto nel frontend mandi { nickname: '...', password: '...' }
    // Se il DTO backend ha ancora 'email', cambialo in 'nickname' o usa un cast temporaneo
    const nickname = loginDto.nickname || (loginDto as any).email;

    const user = await this.collaboratoreService.findOneByNickname(nickname);

    // 2. Controllo password
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    // 3. Payload del token aggiornato
    const payload = {
      sub: user.id,
      nickname: user.nickname, // Usiamo nickname nel token
      nome: user.nome,
      ruolo: user.ruolo,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
