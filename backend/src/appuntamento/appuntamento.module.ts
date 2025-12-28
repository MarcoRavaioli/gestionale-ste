import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppuntamentoService } from './appuntamento.service';
import { AppuntamentoController } from './appuntamento.controller';
import { Appuntamento } from '../entities/appuntamento.entity';
import { Cliente } from '../entities/cliente.entity';
import { Indirizzo } from '../entities/indirizzo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appuntamento, Cliente, Indirizzo])],
  controllers: [AppuntamentoController],
  providers: [AppuntamentoService],
})
export class AppuntamentoModule {}
