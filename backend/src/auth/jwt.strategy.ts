import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Legge il token dall'Header "Authorization: Bearer ..."
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    // Questo metodo viene chiamato automaticamente se il token è valido.
    // Restituisce i dati che troverai dentro "req.user" nei controller.
    return { userId: payload.sub, email: payload.email, ruolo: payload.ruolo };
  }
}
