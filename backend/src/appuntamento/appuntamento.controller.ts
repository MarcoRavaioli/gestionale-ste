import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AppuntamentoService } from './appuntamento.service';
import { CreateAppuntamentoDto } from './dto/create-appuntamento.dto';
import { UpdateAppuntamentoDto } from './dto/update-appuntamento.dto';

@Controller('appuntamento')
export class AppuntamentoController {
  constructor(private readonly appuntamentoService: AppuntamentoService) {}

  @Post()
  create(@Body() createAppuntamentoDto: CreateAppuntamentoDto) {
    return this.appuntamentoService.create(createAppuntamentoDto);
  }

  @Get()
  findAll() {
    return this.appuntamentoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appuntamentoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppuntamentoDto: UpdateAppuntamentoDto) {
    return this.appuntamentoService.update(+id, updateAppuntamentoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appuntamentoService.remove(+id);
  }
}
