import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class DataMaskingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DataMaskingInterceptor.name);

  // Array of keys we want to mask
  private readonly sensitiveKeys = [
    'password',
    'email',
    'telefono',
    'cellulare',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // Mask request body
    const maskedBody = this.maskData(request.body);

    // Log incoming request
    this.logger.log(
      `[REQUEST] ${method} ${url} - Body: ${JSON.stringify(maskedBody)}`,
    );

    const now = Date.now();

    return next.handle().pipe(
      tap((responseBody) => {
        // Mask response body
        const maskedResponse = this.maskData(responseBody);
        const delay = Date.now() - now;

        // Log outgoing response
        this.logger.log(
          `[RESPONSE] ${method} ${url} - Status: ${context.switchToHttp().getResponse().statusCode} - ${delay}ms - Body: ${JSON.stringify(maskedResponse)}`,
        );
      }),
    );
  }

  /**
   * Recursively traverses an object and masks predefined sensitive keys.
   */
  private maskData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskData(item));
    }

    const masked = { ...data };
    for (const key of Object.keys(masked)) {
      if (this.sensitiveKeys.includes(key.toLowerCase())) {
        masked[key] = '********';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskData(masked[key]);
      }
    }

    return masked;
  }
}
