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
    const identifier = loginDto.username;

    // Usiamo il nuovo metodo appena creato
    const user = await this.collaboratoreService.findOneByUsernameOrEmail(identifier);

    if (!user) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    const payload = { 
      sub: user.id, 
      nickname: user.nickname, 
      ruolo: user.ruolo 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nickname: user.nickname,
        nome: user.nome,
        ruolo: user.ruolo
      }
    };
  }
}
