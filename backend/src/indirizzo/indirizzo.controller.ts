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
import { IndirizzoService } from './indirizzo.service';
import { CreateIndirizzoDto } from './dto/create-indirizzo.dto';
import { UpdateIndirizzoDto } from './dto/update-indirizzo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('indirizzo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndirizzoController {
  constructor(private readonly indirizzoService: IndirizzoService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() createIndirizzoDto: CreateIndirizzoDto) {
    return this.indirizzoService.create(createIndirizzoDto);
  }

  @Get()
  findAll() {
    return this.indirizzoService.findAll();
  }

  @Get('paginated')
  findPaginated(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 15,
    @Query('search') search: string = '',
    @Query('orderBy') orderBy: string = 'citta',
    @Query('orderDirection') orderDirection: 'ASC' | 'DESC' = 'ASC',
  ) {
    return this.indirizzoService.findPaginated(+page, +limit, search, orderBy, orderDirection);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.indirizzoService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIndirizzoDto: UpdateIndirizzoDto,
  ) {
    return this.indirizzoService.update(id, updateIndirizzoDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('cascade') cascade?: string,
  ) {
    const isCascade = cascade === 'true';
    return this.indirizzoService.remove(id, isCascade);
  }
}
