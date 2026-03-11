import {
  Controller,
  Get,
  Param,
  Res,
  StreamableFile,
  NotFoundException,
  BadRequestException,
  UseGuards,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join, resolve } from 'path';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/** Cartella radice da cui servire i file — mai uscire da qui */
const UPLOADS_BASE = resolve(process.cwd(), 'uploads');

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard) // 🔒 Serve il Login
export class UploadsController {
  @Get(':folder/:filename')
  getFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
    @Request() req: any,
  ): StreamableFile {
    // 1. SICUREZZA: Solo Admin/Manager vedono le fatture
    if (folder === 'fatture' && req.user.ruolo === 'COLLABORATORE') {
      throw new ForbiddenException('Non hai i permessi per vedere le fatture.');
    }

    // 2. RISOLVI IL PATH IN MODO CANONICO (elimina /../ e simili)
    const safePath = resolve(UPLOADS_BASE, folder, filename);

    // 3. PATH TRAVERSAL CHECK — il path finale DEVE stare dentro UPLOADS_BASE
    if (!safePath.startsWith(UPLOADS_BASE + '/') && safePath !== UPLOADS_BASE) {
      throw new BadRequestException('Percorso file non valido.');
    }

    // 4. CONTROLLA CHE IL FILE ESISTA
    if (!existsSync(safePath)) {
      throw new NotFoundException('File non trovato.');
    }

    const file = createReadStream(safePath);
    return new StreamableFile(file);
  }
}
