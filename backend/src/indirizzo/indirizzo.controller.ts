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
import { IndirizzoService } from './indirizzo.service';
import { CreateIndirizzoDto } from './dto/create-indirizzo.dto';
import { UpdateIndirizzoDto } from './dto/update-indirizzo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('indirizzo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
export class IndirizzoController {
  constructor(private readonly indirizzoService: IndirizzoService) {}

  @Post()
  create(@Body() createIndirizzoDto: CreateIndirizzoDto) {
    return this.indirizzoService.create(createIndirizzoDto);
  }

  @Get()
  findAll() {
    return this.indirizzoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.indirizzoService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIndirizzoDto: UpdateIndirizzoDto,
  ) {
    return this.indirizzoService.update(+id, updateIndirizzoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.indirizzoService.remove(+id);
  }
}
