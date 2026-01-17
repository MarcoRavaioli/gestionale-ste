import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CommessaService } from './commessa.service';
import { CreateCommessaDto } from './dto/create-commessa.dto';
import { UpdateCommessaDto } from './dto/update-commessa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('commessa')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER') // Solo chi gestisce i soldi vede le commesse
export class CommessaController {
  constructor(private readonly commessaService: CommessaService) {}

  @Post()
  create(@Body() createCommessaDto: CreateCommessaDto) {
    return this.commessaService.create(createCommessaDto);
  }

  @Get()
  findAll() {
    return this.commessaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commessaService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCommessaDto: UpdateCommessaDto,
  ) {
    return this.commessaService.update(+id, updateCommessaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commessaService.remove(+id);
  }
}
