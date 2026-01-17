import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { Throttle } from '@nestjs/throttler'; // <--- 1. IMPORTA IL DECORATORE

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  // --- 2. APPLICA LIMITE SEVERO ---
  // Sovrascrive la regola globale.
  // Qui permettiamo solo 5 tentativi ogni 60 secondi (ttl: 60000 ms).
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
