import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Legge quali ruoli sono richiesti per questa rotta/classe
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Se non ci sono ruoli specificati, lascia passare tutti (basta che siano loggati)
    if (!requiredRoles) {
      return true;
    }

    // 3. Recupera l'utente dalla richiesta (inserito dal JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // 4. Controlla se il ruolo dell'utente è tra quelli permessi
    return requiredRoles.some((role) => user.ruolo === role);
  }
}
