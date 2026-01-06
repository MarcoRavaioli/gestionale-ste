import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 1. Controlla se sulla rotta (handler) o sulla classe (class) c'è il decoratore @Public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Se è pubblica, lascia passare (return true)
    if (isPublic) {
      return true;
    }

    // 3. Altrimenti, usa la logica standard del token (blocca se non c'è)
    return super.canActivate(context);
  }
}
