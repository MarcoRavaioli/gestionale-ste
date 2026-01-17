import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Get,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AllegatoService } from './allegato.service';
import { CreateAllegatoDto } from './dto/create-allegato.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('allegato')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER') // Impedisce ai collaboratori di scaricare allegati a caso
export class AllegatoController {
  constructor(private readonly allegatoService: AllegatoService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
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
