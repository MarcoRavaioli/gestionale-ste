import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importa le tue entità
import { Cliente } from './entities/cliente.entity';
import { Indirizzo } from './entities/indirizzo.entity';
import { Commessa } from './entities/commessa.entity';
import { Appuntamento } from './entities/appuntamento.entity';
import { Fattura } from './entities/fattura.entity';
import { Collaboratore } from './entities/collaboratore.entity';
import { TracciamentoPersonale } from './entities/tracciamento.entity';
import { ClienteModule } from './cliente/cliente.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'gestionale.db',
      // Aggiungi tutte le classi qui dentro
      entities: [
        Cliente,
        Indirizzo,
        Commessa,
        Appuntamento,
        Fattura,
        Collaboratore,
        TracciamentoPersonale,
      ],
      synchronize: true, // Questo creerà le tabelle nel DB automaticamente
    }),
    ClienteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
