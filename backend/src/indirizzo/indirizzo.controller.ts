import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IndirizzoService } from './indirizzo.service';
import { CreateIndirizzoDto } from './dto/create-indirizzo.dto';
import { UpdateIndirizzoDto } from './dto/update-indirizzo.dto';

@Controller('indirizzo')
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
  update(@Param('id') id: string, @Body() updateIndirizzoDto: UpdateIndirizzoDto) {
    return this.indirizzoService.update(+id, updateIndirizzoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.indirizzoService.remove(+id);
  }
}
