import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CollaboratoreService } from './collaboratore.service';
import { CreateCollaboratoreDto } from './dto/create-collaboratore.dto';
import { UpdateCollaboratoreDto } from './dto/update-collaboratore.dto';
import { Public } from '../auth/public.decorator'; // <--- 1. IMPORTA QUESTO

@Controller('collaboratore')
export class CollaboratoreController {
  constructor(private readonly collaboratoreService: CollaboratoreService) {}

  @Public() // <--- 2. AGGIUNGI QUESTO PER RENDERE PUBBLICO L'ENDPOINT
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
  update(
    @Param('id') id: string,
    @Body() updateCollaboratoreDto: UpdateCollaboratoreDto,
  ) {
    return this.collaboratoreService.update(+id, updateCollaboratoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collaboratoreService.remove(+id);
  }
}
