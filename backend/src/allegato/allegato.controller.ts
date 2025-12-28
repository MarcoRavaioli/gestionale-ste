import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AllegatoService } from './allegato.service';
import { CreateAllegatoDto } from './dto/create-allegato.dto';

@Controller('allegato')
export class AllegatoController {
  constructor(private readonly allegatoService: AllegatoService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'file' è il nome del campo nel form
  uploadFile(
    @Body() createAllegatoDto: CreateAllegatoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.allegatoService.uploadFile(createAllegatoDto, file);
  }

  @Get()
  findAll() {
    return this.allegatoService.findAll();
  }
}
