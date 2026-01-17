import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
} from '@nestjs/common';
import { FatturaService } from './fattura.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DeepPartial } from 'typeorm';
import { Fattura } from '../entities/fattura.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('fattura')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER', 'ADMIN')
export class FatturaController {
  constructor(private readonly fatturaService: FatturaService) {}

  @Get()
  findAll() {
    return this.fatturaService.findAll();
  }

  // CREAZIONE
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/fatture',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `fattura-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  create(
    @Body() body: any,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file?: Express.Multer.File,
  ) {
    const fatturaData = this.parseBody(body);
    return this.fatturaService.createWithAttachment(fatturaData, file);
  }

  // MODIFICA (PATCH)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/fatture',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `fattura-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file?: Express.Multer.File,
  ) {
    const fatturaData = this.parseBody(body);
    return this.fatturaService.updateWithAttachment(+id, fatturaData, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fatturaService.remove(+id);
  }

  private parseBody(body: any): DeepPartial<Fattura> {
    return {
      numero_fattura: body.numero_fattura,
      data_emissione: body.data_emissione
        ? new Date(body.data_emissione)
        : undefined,
      totale: body.totale ? parseFloat(body.totale) : undefined,
      tipo: body.tipo,
      incassata: body.incassata === 'true',
      descrizione: body.descrizione,
      data_scadenza: body.data_scadenza
        ? new Date(body.data_scadenza)
        : undefined,
      cliente: body.clienteId ? { id: parseInt(body.clienteId) } : null,
      commessa: body.commessaId ? { id: parseInt(body.commessaId) } : null,
    };
  }
}
