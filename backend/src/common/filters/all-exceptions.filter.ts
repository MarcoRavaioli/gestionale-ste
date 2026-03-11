import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let detail: string | undefined;
    let code: string | undefined;

    if (exception instanceof HttpException) {
      // Eccezioni NestJS standard (ValidationPipe, UnauthorizedException, ecc.)
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const obj = exceptionResponse as any;
        message = obj.message ?? exception.message;
        detail = Array.isArray(obj.message)
          ? obj.message.join('; ')
          : obj.error;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof QueryFailedError) {
      // Errori TypeORM / PostgreSQL (es. unique constraint violation)
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = 'Database query failed';
      // driverError contiene il dettaglio nativo di PostgreSQL
      const driverError = (exception as any).driverError ?? {};
      detail = driverError.detail ?? exception.message;
      code = driverError.code;
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unexpected internal error';
    }

    this.logger.error(
      `[${request.method}] ${request.url} → ${status}: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(detail && { detail }),
      ...(code && { dbErrorCode: code }),
    });
  }
}
