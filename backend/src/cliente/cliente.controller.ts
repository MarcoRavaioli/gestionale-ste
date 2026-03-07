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
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
// Importiamo le guardie
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('cliente')
@UseGuards(JwtAuthGuard, RolesGuard) // 1. Protezione Login + Ruoli
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteService.create(createClienteDto);
  }

  @Get('paginated')
  findPaginated(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 15,
    @Query('search') search: string = '',
  ) {
    return this.clienteService.findPaginated(+page, +limit, search);
  }

  @Get()
  findAll() {
    return this.clienteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clienteService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clienteService.update(+id, updateClienteDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('cascade') cascade?: string,
  ) {
    const isCascade = cascade === 'true';
    return this.clienteService.remove(id, isCascade);
  }
}
