import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommessaService } from './commessa.service';
import { CreateCommessaDto } from './dto/create-commessa.dto';
import { UpdateCommessaDto } from './dto/update-commessa.dto';

@Controller('commessa')
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
  update(@Param('id') id: string, @Body() updateCommessaDto: UpdateCommessaDto) {
    return this.commessaService.update(+id, updateCommessaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commessaService.remove(+id);
  }
}
