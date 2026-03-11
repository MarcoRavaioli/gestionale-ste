/**
 * =============================================================
 *  SUITE E2E: CORE FEATURES — gestionale-gspose
 * =============================================================
 *
 *  Cosa da testare:
 *    1. Full-Text Search (Cliente)
 *    2. Global Exception Filter (400, 401, 422)
 *    3. RBAC & Data Masking (COLLABORATORE, ADMIN, MANAGER)
 *
 *  Come girare:
 *    cd ~/docker-data/gestionale-gspose/backend
 *    npm run test:e2e
 *
 *  Il TestAppModule usa il DB "gestionale_test" (dropSchema + synchronize)
 *  per garantire isolamento totale da gestionale_db (produzione).
 * =============================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Entità
import { Cliente } from '../src/entities/cliente.entity';
import { Indirizzo } from '../src/entities/indirizzo.entity';
import { Commessa } from '../src/entities/commessa.entity';
import { Appuntamento } from '../src/entities/appuntamento.entity';
import { Fattura } from '../src/entities/fattura.entity';
import { Collaboratore } from '../src/entities/collaboratore.entity';
import { TracciamentoPersonale } from '../src/entities/tracciamento.entity';
import { Allegato } from '../src/entities/allegato.entity';

// Moduli applicativi
import { ClienteModule } from '../src/cliente/cliente.module';
import { CommessaModule } from '../src/commessa/commessa.module';
import { CollaboratoreModule } from '../src/collaboratore/collaboratore.module';
import { AuthModule } from '../src/auth/auth.module';
import { AppuntamentoModule } from '../src/appuntamento/appuntamento.module';
import { FatturaModule } from '../src/fattura/fattura.module';
import { AllegatoModule } from '../src/allegato/allegato.module';
import { IndirizzoModule } from '../src/indirizzo/indirizzo.module';
import { TracciamentoModule } from '../src/tracciamento/tracciamento.module';

// Guardie e filtri globali
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { DataMaskingInterceptor } from '../src/common/interceptors/data-masking.interceptor';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { UploadsController } from '../src/uploads/uploads.controller';

// ──────────────────────────────────────────────────────────────
// Helper: login e restituzione del Bearer token
// ──────────────────────────────────────────────────────────────
async function loginAs(
  app: INestApplication<App>,
  nickname: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ username: nickname, password });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `loginAs('${nickname}') fallito: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return `Bearer ${res.body.access_token}`;
}

// ──────────────────────────────────────────────────────────────
// Setup globale del modulo di test
// ──────────────────────────────────────────────────────────────
let app: INestApplication<App>;
let adminToken: string;
let managerToken: string;
let collaboratoreToken: string;
let testCommessaId: number;

beforeAll(async () => {
  // Credenziali prese dalle variabili d'ambiente (come in produzione)
  // Sul Raspberry: ADMIN_PASSWORD e MANAGER_PASSWORD sono impostate nel docker-compose
  // I test le leggono via process.env oppure cadono al default
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'adminMarco';
  const managerPassword = process.env.MANAGER_PASSWORD ?? 'gheiBen';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      // Config globale (legge .env)
      ConfigModule.forRoot({ isGlobal: true }),

      // Rate limiting disabilitato nei test (limit altissimo)
      ThrottlerModule.forRoot([{ ttl: 60000, limit: 9999 }]),

      // ─────────────────────────────────────────────
      // DB DI TEST: gestionale_test — COMPLETAMENTE
      // separato da gestionale_db (produzione).
      // dropSchema: true → schema pulito a ogni run.
      // synchronize: true → crea tabelle dalle entity.
      // ─────────────────────────────────────────────
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: 5432,
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'super_segretoo',
        database: 'gestionale_test', // ← MAI tocca gestionale_db
        entities: [
          Cliente,
          Indirizzo,
          Commessa,
          Appuntamento,
          Fattura,
          Collaboratore,
          TracciamentoPersonale,
          Allegato,
        ],
        synchronize: true,  // Crea schema dalle entity
        dropSchema: true,   // Reset totale a ogni test run
      }),

      // Moduli applicativi (stesso codice di produzione)
      ClienteModule,
      CommessaModule,
      CollaboratoreModule,
      AuthModule,
      AppuntamentoModule,
      FatturaModule,
      AllegatoModule,
      IndirizzoModule,
      TracciamentoModule,
    ],
    controllers: [AppController, UploadsController],
    providers: [
      AppService,
      {
        provide: APP_GUARD,
        useClass: JwtAuthGuard,
      },
    ],
  }).compile();

  app = moduleFixture.createNestApplication();

  // Replica identica della configurazione in main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new DataMaskingInterceptor());

  await app.init();

  // ── Seed: utenti di base ──────────────────────────────────
  // CollaboratoreService.onModuleInit() ha già creato marco123 e Stefano03.
  // Creiamo un collaboratore con ruolo COLLABORATORE per il test RBAC.
  adminToken = await loginAs(app, 'marco123', adminPassword);
  managerToken = await loginAs(app, 'Stefano03', managerPassword);

  // Crea un collaboratore di test con ruolo COLLABORATORE
  const collabRes = await request(app.getHttpServer())
    .post('/collaboratore')
    .set('Authorization', adminToken)
    .send({
      nome: 'TestCollab',
      cognome: 'E2E',
      nickname: 'testcollab_e2e',
      email: 'testcollab@e2e.it',
      password: 'password123',
      ruolo: 'COLLABORATORE',
    });

  // Se già esiste (per un rimbalzo del dropSchema), ignoriamo
  if (collabRes.status !== 201 && collabRes.status !== 200 && collabRes.status !== 409) {
    throw new Error(`Seed collaboratore fallito: ${collabRes.status} ${JSON.stringify(collabRes.body)}`);
  }

  collaboratoreToken = await loginAs(app, 'testcollab_e2e', 'password123');

  // ── Seed: clienti per la ricerca full-text ────────────────
  await request(app.getHttpServer())
    .post('/cliente')
    .set('Authorization', adminToken)
    .send({ nome: 'Mario Rossi', telefono: '3331001001', email: 'mario.rossi@test.it' });

  await request(app.getHttpServer())
    .post('/cliente')
    .set('Authorization', adminToken)
    .send({ nome: 'Luca Bianchi', telefono: '3332002002', email: 'luca.bianchi@test.it' });

  await request(app.getHttpServer())
    .post('/cliente')
    .set('Authorization', adminToken)
    .send({ nome: 'Anna Verdi', telefono: '3333003003', email: 'anna@test.it' });

  // ── Seed: commessa per il test RBAC ──────────────────────
  const commessaRes = await request(app.getHttpServer())
    .post('/commessa')
    .set('Authorization', adminToken)
    .send({
      seriale: 'TEST-RBAC-001',
      descrizione: 'Commessa per test E2E RBAC',
      valore_totale: 9999.99,
      stato: 'APERTA',
    });

  if (commessaRes.status !== 201 && commessaRes.status !== 200) {
    throw new Error(`Seed commessa fallito: ${commessaRes.status} ${JSON.stringify(commessaRes.body)}`);
  }
  testCommessaId = commessaRes.body.id;
}, 60000); // timeout 60s per connessione DB + seed

afterAll(async () => {
  await app.close();
});

// ══════════════════════════════════════════════════════════════
// DESCRIBE 1: Full-Text Search Cliente
// ══════════════════════════════════════════════════════════════
describe('Full-Text Search Cliente', () => {
  it('cerca "Rossi" → restituisce 1 risultato con nome corretto', async () => {
    const res = await request(app.getHttpServer())
      .get('/cliente/paginated?page=1&limit=10&search=Rossi')
      .set('Authorization', adminToken)
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.data[0].nome).toBe('Mario Rossi');
  });

  it('cerca "luca" (case-insensitive) → 1 risultato', async () => {
    const res = await request(app.getHttpServer())
      .get('/cliente/paginated?page=1&limit=10&search=luca')
      .set('Authorization', adminToken)
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.data[0].nome.toLowerCase()).toContain('luca');
  });

  it('cerca "anna@test.it" (campo email) → 1 risultato', async () => {
    const res = await request(app.getHttpServer())
      .get('/cliente/paginated?page=1&limit=10&search=anna@test.it')
      .set('Authorization', adminToken)
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.data[0].email).toBe('anna@test.it');
  });

  it('cerca "xyz_inesistente" → 0 risultati', async () => {
    const res = await request(app.getHttpServer())
      .get('/cliente/paginated?page=1&limit=10&search=xyz_inesistente')
      .set('Authorization', adminToken)
      .expect(200);

    expect(res.body.total).toBe(0);
    expect(res.body.data).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════
// DESCRIBE 2: Global Exception Filter
// ══════════════════════════════════════════════════════════════
describe('Global Exception Filter', () => {
  it('POST /cliente senza "nome" → 400 con struttura errore dettagliata', async () => {
    const res = await request(app.getHttpServer())
      .post('/cliente')
      .set('Authorization', adminToken)
      .send({}) // Payload invalido: manca nome (required)
      .expect(400);

    // Il filter deve restituire un JSON strutturato, non un 500 generico
    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('path');
  });

  it('POST /cliente con campo extra non permesso → 400 (forbidNonWhitelisted)', async () => {
    const res = await request(app.getHttpServer())
      .post('/cliente')
      .set('Authorization', adminToken)
      .send({ nome: 'Test', campoEsistente: 'hackervalue' })
      .expect(400);

    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body).toHaveProperty('message');
  });

  it('POST /auth/login con credenziali errate → 401 con messaggio specifico', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'utente_inesistente', password: 'passwordsbagliata' })
      .expect(401);

    expect(res.body).toHaveProperty('statusCode', 401);
    // Il messaggio deve contenere l'indicazione credenziali non valide, non "Internal Server Error"
    expect(res.body.message).toMatch(/credenziali/i);
  });

  it('POST /collaboratore con nickname duplicato → 422 con dbErrorCode "23505"', async () => {
    // Primo inserimento (successo atteso)
    await request(app.getHttpServer())
      .post('/collaboratore')
      .set('Authorization', adminToken)
      .send({
        nome: 'Duplicato',
        cognome: 'Test',
        nickname: 'duplicato_e2e',
        email: 'dup1@e2e.it',
        password: 'password123',
        ruolo: 'COLLABORATORE',
      });

    // Secondo inserimento: stesso nickname → unique constraint violation
    const res = await request(app.getHttpServer())
      .post('/collaboratore')
      .set('Authorization', adminToken)
      .send({
        nome: 'Duplicato',
        cognome: 'Test2',
        nickname: 'duplicato_e2e', // stesso nickname → viola UNIQUE
        email: 'dup2@e2e.it',
        password: 'password123',
        ruolo: 'COLLABORATORE',
      })
      .expect(422);

    // La filter deve esporre il dettaglio PostgreSQL, non un 500 generico
    expect(res.body).toHaveProperty('statusCode', 422);
    expect(res.body).toHaveProperty('dbErrorCode', '23505'); // codice PG unique violation
    expect(res.body).toHaveProperty('detail');
    // Il detail deve menzionare la chiave duplicata
    expect(typeof res.body.detail).toBe('string');
  });

  it('GET /commessa senza token → 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer())
      .get('/commessa')
      // Nessun Authorization header
      .expect(401);

    expect(res.body).toHaveProperty('statusCode', 401);
  });
});

// ══════════════════════════════════════════════════════════════
// DESCRIBE 3: RBAC & Data Masking
// ══════════════════════════════════════════════════════════════
describe('RBAC & Data Masking', () => {
  it('COLLABORATORE — GET /commessa/paginated → valore_totale è null (mascherato)', async () => {
    const res = await request(app.getHttpServer())
      .get('/commessa/paginated?page=1&limit=10')
      .set('Authorization', collaboratoreToken)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    // Ogni commessa nella lista DEVE avere valore_totale = null per i collaboratori
    for (const commessa of res.body.data) {
      expect(commessa.valore_totale).toBeNull();
    }
  });

  it('COLLABORATORE — GET /commessa/:id → valore_totale e fatture sono null', async () => {
    const res = await request(app.getHttpServer())
      .get(`/commessa/${testCommessaId}`)
      .set('Authorization', collaboratoreToken)
      .expect(200);

    expect(res.body).toHaveProperty('valore_totale', null);
    expect(res.body).toHaveProperty('fatture', null);
  });

  it('ADMIN — GET /commessa/:id → valore_totale è visibile e corretto', async () => {
    const res = await request(app.getHttpServer())
      .get(`/commessa/${testCommessaId}`)
      .set('Authorization', adminToken)
      .expect(200);

    // L'admin deve vedere il valore_totale che abbiamo seeded (9999.99)
    expect(res.body.valore_totale).toBe(9999.99);
    expect(res.body.valore_totale).not.toBeNull();
  });

  it('MANAGER — GET /commessa/:id → valore_totale è visibile e corretto', async () => {
    const res = await request(app.getHttpServer())
      .get(`/commessa/${testCommessaId}`)
      .set('Authorization', managerToken)
      .expect(200);

    expect(res.body.valore_totale).toBe(9999.99);
    expect(res.body.valore_totale).not.toBeNull();
  });

  it('COLLABORATORE — DELETE /commessa/:id → 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/commessa/${testCommessaId}`)
      .set('Authorization', collaboratoreToken)
      .expect(403);

    expect(res.body).toHaveProperty('statusCode', 403);
  });
});
