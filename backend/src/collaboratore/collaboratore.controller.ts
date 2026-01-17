import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  ForbiddenException,
  UseGuards, // <--- 1. IMPORTA QUESTO
} from '@nestjs/common';
import { CollaboratoreService } from './collaboratore.service';
import { CreateCollaboratoreDto } from './dto/create-collaboratore.dto';
import { UpdateCollaboratoreDto } from './dto/update-collaboratore.dto';
// Importa le guardie
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('collaboratore')
@UseGuards(JwtAuthGuard, RolesGuard) // <--- 2. FONDAMENTALE: Attiva la protezione!
export class CollaboratoreController {
  constructor(private readonly collaboratoreService: CollaboratoreService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createDto: CreateCollaboratoreDto, @Request() req: any) {
    // Il controllo if(createDto.ruolo === 'ADMIN') è ottimo tenerlo qui per sicurezza extra logic
    if (createDto.ruolo === 'ADMIN') {
      throw new ForbiddenException(
        'Non è possibile creare nuovi Admin per sicurezza.',
      );
    }
    return this.collaboratoreService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll() {
    return this.collaboratoreService.findAll();
  }

  @Get(':id')
  // Nessun @Roles = Accessibile a tutti gli utenti loggati (es. per vedere il proprio profilo)
  findOne(@Param('id') id: string) {
    return this.collaboratoreService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCollaboratoreDto,
    @Request() req: any,
  ) {
    // Controllo logico: O sei Admin, o stai modificando te stesso
    if (req.user.ruolo !== 'ADMIN' && req.user.userId !== +id) {
      throw new ForbiddenException('Non puoi modificare questo utente.');
    }
    return this.collaboratoreService.update(+id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN') // Solo Admin può cancellare
  remove(@Param('id') id: string) {
    return this.collaboratoreService.remove(+id);
  }
}
