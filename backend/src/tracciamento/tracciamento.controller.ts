import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TracciamentoService } from './tracciamento.service';
import { CreateTracciamentoDto } from './dto/create-tracciamento.dto';
import { UpdateTracciamentoDto } from './dto/update-tracciamento.dto';

@Controller('tracciamento')
export class TracciamentoController {
  constructor(private readonly tracciamentoService: TracciamentoService) {}

  @Post()
  create(@Body() createTracciamentoDto: CreateTracciamentoDto) {
    return this.tracciamentoService.create(createTracciamentoDto);
  }

  @Get()
  findAll() {
    return this.tracciamentoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tracciamentoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTracciamentoDto: UpdateTracciamentoDto) {
    return this.tracciamentoService.update(+id, updateTracciamentoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tracciamentoService.remove(+id);
  }
}
