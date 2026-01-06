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
import { Allegato } from './entities/allegato.entity'; // <--- 1. IMPORTA ALLEGATO

import { ClienteModule } from './cliente/cliente.module';
import { AppuntamentoModule } from './appuntamento/appuntamento.module';
import { CommessaModule } from './commessa/commessa.module';
import { CollaboratoreModule } from './collaboratore/collaboratore.module';
import { TracciamentoModule } from './tracciamento/tracciamento.module';
import { FatturaModule } from './fattura/fattura.module';
import { AllegatoModule } from './allegato/allegato.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core'; // <--- IMPORTA QUESTO
import { JwtAuthGuard } from './auth/jwt-auth.guard'; // <--- IMPORTA IL TUO GUARD
import { IndirizzoModule } from './indirizzo/indirizzo.module';

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
        Allegato, // <--- 2. AGGIUNGI ALLEGATO NELLA LISTA
      ],
      synchronize: true,
    }),
    ClienteModule,
    AppuntamentoModule,
    CommessaModule,
    CollaboratoreModule,
    TracciamentoModule,
    FatturaModule,
    AllegatoModule,
    AuthModule,
    IndirizzoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
