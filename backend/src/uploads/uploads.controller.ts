import {
  Controller,
  Get,
  Param,
  Res,
  StreamableFile,
  NotFoundException,
  UseGuards,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard) // 🔒 PROTEZIONE BASE: Serve il Login
export class UploadsController {
  @Get(':folder/:filename')
  getFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
    @Request() req: any,
  ): StreamableFile {
    // 1. SICUREZZA AGGIUNTIVA: Solo Admin/Manager vedono le fatture
    if (folder === 'fatture' && req.user.ruolo === 'COLLABORATORE') {
      throw new ForbiddenException('Non hai i permessi per vedere le fatture.');
    }

    // 2. COSTRUISCI IL PERCORSO SICURO
    // process.cwd() è la cartella radice del progetto
    const safePath = join(process.cwd(), 'uploads', folder, filename);

    // 3. CONTROLLA CHE IL FILE ESISTA
    if (!existsSync(safePath)) {
      throw new NotFoundException('File non trovato.');
    }

    // 4. IMPOSTA L'HEADER CORRETTO (Così il browser sa che è un PDF/Immagine)
    // Opzionale: Se vuoi forzare il download usa 'application/octet-stream'
    // Se vuoi vederlo nel browser (es. immagine profilo) Nest lo gestisce in automatico spesso,
    // ma puoi specificare il Content-Type se serve.

    const file = createReadStream(safePath);
    return new StreamableFile(file);
  }
}
