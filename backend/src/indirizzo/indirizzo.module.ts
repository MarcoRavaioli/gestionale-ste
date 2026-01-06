import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndirizzoService } from './indirizzo.service';
import { IndirizzoController } from './indirizzo.controller';
import { Indirizzo } from '../entities/indirizzo.entity'; // <--- Importa da entities centrali

@Module({
  imports: [TypeOrmModule.forFeature([Indirizzo])],
  controllers: [IndirizzoController],
  providers: [IndirizzoService],
})
export class IndirizzoModule {}
