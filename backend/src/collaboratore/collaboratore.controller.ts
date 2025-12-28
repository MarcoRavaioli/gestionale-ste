import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CollaboratoreService } from './collaboratore.service';
import { CreateCollaboratoreDto } from './dto/create-collaboratore.dto';
import { UpdateCollaboratoreDto } from './dto/update-collaboratore.dto';

@Controller('collaboratore')
export class CollaboratoreController {
  constructor(private readonly collaboratoreService: CollaboratoreService) {}

  @Post()
  create(@Body() createCollaboratoreDto: CreateCollaboratoreDto) {
    return this.collaboratoreService.create(createCollaboratoreDto);
  }

  @Get()
  findAll() {
    return this.collaboratoreService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collaboratoreService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCollaboratoreDto: UpdateCollaboratoreDto) {
    return this.collaboratoreService.update(+id, updateCollaboratoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collaboratoreService.remove(+id);
  }
}
