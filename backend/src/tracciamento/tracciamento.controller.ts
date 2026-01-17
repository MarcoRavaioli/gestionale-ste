import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  Delete,
  Param,
  Patch, // <--- 1. IMPORTA PATCH
} from '@nestjs/common';
import { TracciamentoService } from './tracciamento.service';
import { CreateTracciamentoDto } from './dto/create-tracciamento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tracciamento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TracciamentoController {
  constructor(private readonly service: TracciamentoService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateTracciamentoDto) {
    return this.service.create(req.user.userId, dto);
  }

  // --- NUOVO ENDPOINT: MODIFICA ---
  // Questo mancava, ecco perché l'app dava errore
  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    // Passiamo l'ID utente per assicurarci che modifichi solo i suoi dati
    return this.service.update(+id, req.user.userId, dto);
  }

  @Get('me')
  getMyHistory(@Request() req) {
    return this.service.findMyHistory(req.user.userId);
  }

  @Get('report')
  @Roles('ADMIN', 'MANAGER')
  getReport(@Query('anno') anno: number, @Query('mese') mese: number) {
    return this.service.getMonthlyReport(Number(anno), Number(mese));
  }

  @Get('completamento')
  @Roles('ADMIN', 'MANAGER')
  getCompletion(@Query('anno') anno: number, @Query('mese') mese: number) {
    return this.service.getCompletionStatus(Number(anno), Number(mese));
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(+id, req.user.userId);
  }
}
