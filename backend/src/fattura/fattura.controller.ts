import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FatturaService } from './fattura.service';
import { CreateFatturaDto } from './dto/create-fattura.dto';
import { UpdateFatturaDto } from './dto/update-fattura.dto';

@Controller('fattura')
export class FatturaController {
  constructor(private readonly fatturaService: FatturaService) {}

  @Post()
  create(@Body() createFatturaDto: CreateFatturaDto) {
    return this.fatturaService.create(createFatturaDto);
  }

  @Get()
  findAll() {
    return this.fatturaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fatturaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFatturaDto: UpdateFatturaDto) {
    return this.fatturaService.update(+id, updateFatturaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fatturaService.remove(+id);
  }
}
