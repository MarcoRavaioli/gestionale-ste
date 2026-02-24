import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// --- 1. IMPORTA IL THROTTLER ---
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// ... altri import (Cliente, Indirizzo, ecc...) rimangono uguali
import { Cliente } from './entities/cliente.entity';
import { Indirizzo } from './entities/indirizzo.entity';
import { Commessa } from './entities/commessa.entity';
import { Appuntamento } from './entities/appuntamento.entity';
import { Fattura } from './entities/fattura.entity';
import { Collaboratore } from './entities/collaboratore.entity';
import { TracciamentoPersonale } from './entities/tracciamento.entity';
import { Allegato } from './entities/allegato.entity';

import { ClienteModule } from './cliente/cliente.module';
import { AppuntamentoModule } from './appuntamento/appuntamento.module';
import { CommessaModule } from './commessa/commessa.module';
import { CollaboratoreModule } from './collaboratore/collaboratore.module';
import { TracciamentoModule } from './tracciamento/tracciamento.module';
import { FatturaModule } from './fattura/fattura.module';
import { AllegatoModule } from './allegato/allegato.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { IndirizzoModule } from './indirizzo/indirizzo.module';
import { UploadsController } from './uploads/uploads.controller';

@Module({
  imports: [
    // --- 2. CONFIGURAZIONE RATE LIMITING GLOBALE ---
    // Impostiamo una regola base: Max 100 richieste ogni 60 secondi per IP.
    // Questo protegge da attacchi DDoS generici su tutta l'app.
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 secondi (in millisecondi)
        limit: 100, // Limite richieste
      },
    ]),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'super_segreto',
      database: process.env.DB_NAME || 'gestionale_db',
      entities: [
        Cliente, Indirizzo, Commessa, Appuntamento,
        Fattura, Collaboratore, TracciamentoPersonale, Allegato,
      ],
      synchronize: false, 
      migrationsRun: true,
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    }),

    // ... moduli
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
  controllers: [AppController, UploadsController],
  providers: [
    AppService,
    // --- 3. ATTIVAZIONE GUARDIA AUTH (Esistente) ---
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // --- 4. ATTIVAZIONE GUARDIA THROTTLER (Nuova) ---
    // Questa guardia controlla ogni richiesta rispetto alle regole impostate
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
