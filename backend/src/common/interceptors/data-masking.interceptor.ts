import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

/** Campi finanziari/sensibili da rimuovere dalla response per i COLLABORATORI */
const FINANCIAL_FIELDS = ['valore_totale', 'fatture'];

@Injectable()
export class DataMaskingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DataMaskingInterceptor.name);

  /** Campi da mascherare nei log (non rimossi dalla response, solo oscurati nel log) */
  private readonly logSensitiveKeys = ['password', 'email', 'telefono', 'cellulare'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const userRole: string | undefined = request.user?.ruolo;

    // Maschera il body nel log
    const maskedBody = this.maskForLog(request.body);
    this.logger.log(
      `[REQUEST] ${method} ${url} - Role: ${userRole ?? 'anon'} - Body: ${JSON.stringify(maskedBody)}`,
    );

    const now = Date.now();

    return next.handle().pipe(
      // Prima rimuoviamo i dati finanziari se l'utente è un COLLABORATORE
      map((responseBody) => {
        if (userRole === 'COLLABORATORE') {
          return this.stripFinancialData(responseBody);
        }
        return responseBody;
      }),
      // Poi logghiamo la response mascherata (solo per log, non altera il dato)
      tap((responseBody) => {
        const maskedResponse = this.maskForLog(responseBody);
        const delay = Date.now() - now;
        this.logger.log(
          `[RESPONSE] ${method} ${url} - Status: ${context.switchToHttp().getResponse().statusCode} - ${delay}ms - Body: ${JSON.stringify(maskedResponse)}`,
        );
      }),
    );
  }

  /**
   * Rimuove ricorsivamente i campi finanziari dall'oggetto response.
   * Gestisce sia oggetti singoli che array e strutture paginate { data: [...] }.
   */
  private stripFinancialData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.stripFinancialData(item));
    }

    const stripped = { ...data };
    for (const key of FINANCIAL_FIELDS) {
      if (key in stripped) {
        stripped[key] = null;
      }
    }

    // Ricorsione sui valori oggetto (es. commessa dentro un appuntamento)
    for (const key of Object.keys(stripped)) {
      if (stripped[key] && typeof stripped[key] === 'object') {
        stripped[key] = this.stripFinancialData(stripped[key]);
      }
    }

    return stripped;
  }

  /**
   * Oscura i campi sensibili SOLO per il log (la response al client non viene alterata).
   */
  private maskForLog(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.maskForLog(item));
    }

    const masked = { ...data };
    for (const key of Object.keys(masked)) {
      if (this.logSensitiveKeys.includes(key.toLowerCase())) {
        masked[key] = '********';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskForLog(masked[key]);
      }
    }

    return masked;
  }
}
