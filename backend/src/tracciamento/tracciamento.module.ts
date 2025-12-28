import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TracciamentoService } from './tracciamento.service';
import { TracciamentoController } from './tracciamento.controller';
import { TracciamentoPersonale } from '../entities/tracciamento.entity';
import { Collaboratore } from '../entities/collaboratore.entity';
import { Commessa } from '../entities/commessa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TracciamentoPersonale, Collaboratore, Commessa]),
  ],
  controllers: [TracciamentoController],
  providers: [TracciamentoService],
})
export class TracciamentoModule {}
