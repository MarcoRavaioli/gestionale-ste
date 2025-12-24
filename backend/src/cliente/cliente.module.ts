import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <--- Importante
import { ClienteService } from './cliente.service';
import { ClienteController } from './cliente.controller';
import { Cliente } from '../entities/cliente.entity'; // <--- Importiamo la nostra entità centrale

@Module({
  imports: [TypeOrmModule.forFeature([Cliente])], // <--- Registriamo il Repository
  controllers: [ClienteController],
  providers: [ClienteService],
})
export class ClienteModule {}
