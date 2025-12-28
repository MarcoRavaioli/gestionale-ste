import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommessaService } from './commessa.service';
import { CommessaController } from './commessa.controller';
// MODIFICA QUI GLI IMPORT:
import { Commessa } from '../entities/commessa.entity';
import { Cliente } from '../entities/cliente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Commessa, Cliente])],
  controllers: [CommessaController],
  providers: [CommessaService],
})
export class CommessaModule {}
