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

  @Get('paginated')
  findPaginated(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
  ) {
    return this.commessaService.findPaginated(
      Number(page),
      Number(limit),
      search,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commessaService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommessaDto: UpdateCommessaDto,
  ) {
    return this.commessaService.update(id, updateCommessaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commessaService.remove(id);
  }
}
