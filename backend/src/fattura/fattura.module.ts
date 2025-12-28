import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FatturaService } from './fattura.service';
import { FatturaController } from './fattura.controller';
import { Fattura } from '../entities/fattura.entity';
import { Cliente } from '../entities/cliente.entity';
import { Commessa } from '../entities/commessa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fattura, Cliente, Commessa])],
  controllers: [FatturaController],
  providers: [FatturaService],
})
export class FatturaModule {}
