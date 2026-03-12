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
  @Roles('ADMIN', 'MANAGER')
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
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCollaboratoreDto,
    @Request() req: any,
  ) {
    // 1. Logic check: Only Admin can change roles
    if (updateDto.ruolo !== undefined && req.user.ruolo !== 'ADMIN') {
      throw new ForbiddenException(
        'Solo un Admin può modificare il ruolo di un utente.',
      );
    }

    return this.collaboratoreService.update(+id, updateDto, req.user);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.collaboratoreService.remove(+id, req.user);
  }
}
