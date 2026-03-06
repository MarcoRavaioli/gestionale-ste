import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AppuntamentoService } from './appuntamento.service';
import { CreateAppuntamentoDto } from './dto/create-appuntamento.dto';
import { UpdateAppuntamentoDto } from './dto/update-appuntamento.dto';
// Importiamo le guardie di sicurezza
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('appuntamento')
@UseGuards(JwtAuthGuard, RolesGuard) // <--- 1. Protegge TUTTO: serve essere loggati
export class AppuntamentoController {
  constructor(private readonly appuntamentoService: AppuntamentoService) {}

  // 🔓 LETTURA: Nessun @Roles, quindi accessibile a COLLABORATORI, MANAGER e ADMIN
  @Get()
  findAll() {
    return this.appuntamentoService.findAll();
  }

  @Get('paginated')
  findPaginated(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
  ) {
    return this.appuntamentoService.findPaginated(
      Number(page),
      Number(limit),
      search,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appuntamentoService.findOne(id);
  }

  // 🔒 CREAZIONE: Solo i capi possono assegnare lavoro
  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() createAppuntamentoDto: CreateAppuntamentoDto) {
    return this.appuntamentoService.create(createAppuntamentoDto);
  }

  // 🔒 MODIFICA: Solo i capi possono cambiare date o dettagli
  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppuntamentoDto: UpdateAppuntamentoDto,
  ) {
    return this.appuntamentoService.update(id, updateAppuntamentoDto);
  }

  // 🔒 CANCELLAZIONE: Solo i capi possono eliminare
  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appuntamentoService.remove(id);
  }
}
