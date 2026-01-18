import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Get,
  UseGuards,
  Param,
  Delete,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// MODIFICA QUI: Usa 'import type' per Response
import type { Response } from 'express';
import { AllegatoService } from './allegato.service';
import { CreateAllegatoDto } from './dto/create-allegato.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as fs from 'fs';

@Controller('allegato')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AllegatoController {
  constructor(private readonly allegatoService: AllegatoService) {}

  // ... (uploadFile e findAll rimangono uguali) ...

  @Post('upload')
  @Roles('ADMIN', 'MANAGER', 'COLLABORATORE')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Body() createAllegatoDto: CreateAllegatoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.allegatoService.uploadFile(createAllegatoDto, file);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll() {
    return this.allegatoService.findAll();
  }

  // --- MODIFICA QUI ---
  @Get(':id/download')
  @Roles('ADMIN', 'MANAGER', 'COLLABORATORE')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const allegato = await this.allegatoService.findOne(+id);

    if (!fs.existsSync(allegato.percorso)) {
      throw new NotFoundException('Il file fisico non esiste più sul server.');
    }

    res.download(allegato.percorso, allegato.nome_file);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Param('id') id: string) {
    return this.allegatoService.remove(+id);
  }
}
