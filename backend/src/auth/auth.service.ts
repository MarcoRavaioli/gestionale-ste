import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CollaboratoreService } from '../collaboratore/collaboratore.service';
import { LoginDto } from './dto/login.dto'; // Creeremo questo DTO tra poco

@Injectable()
export class AuthService {
  constructor(
    private collaboratoreService: CollaboratoreService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // 1. Cerchiamo l'utente nel DB
    const user = await this.collaboratoreService.findOneByEmail(loginDto.email);

    // 2. Se non esiste o la password non corrisponde all'hash
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    // 3. Se tutto ok, generiamo il Token JWT
    // Dentro il token nascondiamo l'ID e il Ruolo dell'utente (il "payload")
    const payload = { sub: user.id, email: user.email, ruolo: user.ruolo };

    return {
      access_token: this.jwtService.sign(payload), // Restituisce la stringa lunga
    };
  }
}
