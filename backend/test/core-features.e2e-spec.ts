/**
 * =============================================================
 *  SUITE E2E: CORE FEATURES — gestionale-gspose
 * =============================================================
 *
 *  Come girare (dal Raspberry Pi):
 *    cd ~/docker-data/gestionale-gspose/backend
 *    npm run test:e2e
 *
 *  Prerequisiti:
 *    1. Esporre porta 5432 nel docker-compose principale (~/) o avere
 *       un PostgreSQL accessibile su localhost:5432
 *    2. Creare il DB di test (solo la prima volta):
 *       docker exec gspose-db psql -U postgres -c "CREATE DATABASE gestionale_test;"
 * =============================================================
 */

// ── Env vars per il test ─────────────────────────────────────────
// DEVONO essere impostati prima di qualsiasi istanziazione di moduli NestJS.
// Usiamo i valori da .env se presenti, altrimenti fallback sicuri per il test.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-for-e2e-2026';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'adminMarco';
process.env.MANAGER_PASSWORD = process.env.MANAGER_PASSWORD ?? 'gheiBen';
// DB: usa 'localhost' di default; il container gspose-db deve esporre 5432
process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
process.env.DB_USER = process.env.DB_USER ?? 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'super_segretoo';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

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

// Guards e filtri globali
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
      `loginAs('${nickname}') fallito: HTTP ${res.status} — ${JSON.stringify(res.body)}`,
    );
  }
  return `Bearer ${res.body.access_token}`;
}

// ──────────────────────────────────────────────────────────────
// Variabili globali di test
// ──────────────────────────────────────────────────────────────
let app: INestApplication<App>;
let adminToken: string;
let managerToken: string;
let collaboratoreToken: string;
let testCommessaId: number;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      // Config globale — carica .env se presente, env vars già forzate sopra
      ConfigModule.forRoot({ isGlobal: true }),

      // Rate limiting permissivo per i test
      ThrottlerModule.forRoot([{ ttl: 60000, limit: 9999 }]),

      // ─────────────────────────────────────────────────────
      // DB DI TEST: gestionale_test
      //   - completamente separato da gestionale_db (produzione)
      //   - dropSchema: true  → schema pulito a ogni run
      //   - synchronize: true → crea tabelle dalle entity TypeORM
      // ─────────────────────────────────────────────────────
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: 5432,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'gestionale_test',
        entities: [
          Cliente, Indirizzo, Commessa, Appuntamento,
          Fattura, Collaboratore, TracciamentoPersonale, Allegato,
        ],
        synchronize: true,
        dropSchema: true,
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
      { provide: APP_GUARD, useClass: JwtAuthGuard },
    ],
  }).compile();

  app = moduleFixture.createNestApplication();

  // Replica identica di main.ts
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new DataMaskingInterceptor());

  await app.init();

  // ── Seed: login admin e manager (utenti creati da onModuleInit) ─
  adminToken = await loginAs(app, 'marco123', process.env.ADMIN_PASSWORD!);
  managerToken = await loginAs(app, 'Stefano03', process.env.MANAGER_PASSWORD!);

  // ── Seed: collaboratore di test con ruolo COLLABORATORE ─────────
  const collabPayload = {
    nome: 'TestCollab',
    cognome: 'E2E',
    nickname: 'testcollab_e2e',
    email: 'testcollab@e2e.it',
    password: 'password123',
    ruolo: 'COLLABORATORE',
  };

  const collabRes = await request(app.getHttpServer())
    .post('/collaboratore')
    .set('Authorization', adminToken)
    .send(collabPayload);

  if (![200, 201].includes(collabRes.status)) {
    throw new Error(`Seed collaboratore fallito: ${collabRes.status} ${JSON.stringify(collabRes.body)}`);
  }

  collaboratoreToken = await loginAs(app, 'testcollab_e2e', 'password123');

  // ── Seed: 3 clienti per la Full-Text Search ─────────────────────
  await request(app.getHttpServer()).post('/cliente').set('Authorization', adminToken)
    .send({ nome: 'Mario Rossi', telefono: '3331001001', email: 'mario.rossi@test.it' });
  await request(app.getHttpServer()).post('/cliente').set('Authorization', adminToken)
    .send({ nome: 'Luca Bianchi', telefono: '3332002002', email: 'luca.bianchi@test.it' });
  await request(app.getHttpServer()).post('/cliente').set('Authorization', adminToken)
    .send({ nome: 'Anna Verdi', telefono: '3333003003', email: 'anna@test.it' });

  // ── Seed: commessa per i test RBAC ──────────────────────────────
  const commessaRes = await request(app.getHttpServer())
    .post('/commessa')
    .set('Authorization', adminToken)
    .send({ seriale: 'TEST-RBAC-001', descrizione: 'Commessa E2E RBAC', valore_totale: 9999.99, stato: 'APERTA' });

  if (![200, 201].includes(commessaRes.status)) {
    throw new Error(`Seed commessa fallito: ${commessaRes.status} ${JSON.stringify(commessaRes.body)}`);
  }
  testCommessaId = commessaRes.body.id;
}, 60000);

afterAll(async () => {
  if (app) await app.close();
});

// ══════════════════════════════════════════════════════════════
// DESCRIBE 1: Full-Text Search Cliente
// ══════════════════════════════════════════════════════════════
describe('Full-Text Search Cliente', () => {
  it('cerca "Rossi" → 1 risultato con nome corretto', async () => {
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
  it('POST /cliente senza "nome" → 400 strutturato (non 500 generico)', async () => {
    const res = await request(app.getHttpServer())
      .post('/cliente')
      .set('Authorization', adminToken)
      .send({})
      .expect(400);

    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('path');
  });

  it('POST /cliente con campo extra (forbidNonWhitelisted) → 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/cliente')
      .set('Authorization', adminToken)
      .send({ nome: 'Test', campoHacker: 'valore_non_permesso' })
      .expect(400);

    expect(res.body).toHaveProperty('statusCode', 400);
  });

  it('POST /auth/login credenziali errate → 401 con messaggio specifico', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'utente_inesistente', password: 'password_sbagliata' })
      .expect(401);

    expect(res.body).toHaveProperty('statusCode', 401);
    expect(res.body.message).toMatch(/credenziali/i);
  });

  it('POST /collaboratore nickname duplicato → 422 con dbErrorCode "23505"', async () => {
    // Primo inserimento OK
    await request(app.getHttpServer())
      .post('/collaboratore')
      .set('Authorization', adminToken)
      .send({ nome: 'Dup', cognome: 'Test', nickname: 'duplicato_e2e', email: 'dup1@e2e.it', password: 'password123' });

    // Secondo inserimento: stesso nickname → PostgreSQL unique constraint
    const res = await request(app.getHttpServer())
      .post('/collaboratore')
      .set('Authorization', adminToken)
      .send({ nome: 'Dup', cognome: 'Test2', nickname: 'duplicato_e2e', email: 'dup2@e2e.it', password: 'password123' })
      .expect(422);

    expect(res.body).toHaveProperty('statusCode', 422);
    expect(res.body).toHaveProperty('dbErrorCode', '23505');
    expect(res.body).toHaveProperty('detail');
    expect(typeof res.body.detail).toBe('string');
  });

  it('GET /commessa senza Authorization → 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer())
      .get('/commessa')
      .expect(401);

    expect(res.body).toHaveProperty('statusCode', 401);
  });
});

// ══════════════════════════════════════════════════════════════
// DESCRIBE 3: RBAC & Data Masking
// ══════════════════════════════════════════════════════════════
describe('RBAC & Data Masking', () => {
  it('COLLABORATORE — GET /commessa/paginated → ogni item ha valore_totale === null', async () => {
    const res = await request(app.getHttpServer())
      .get('/commessa/paginated?page=1&limit=10')
      .set('Authorization', collaboratoreToken)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
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

  it('ADMIN — GET /commessa/:id → valore_totale visibile (9999.99)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/commessa/${testCommessaId}`)
      .set('Authorization', adminToken)
      .expect(200);

    expect(res.body.valore_totale).toBe(9999.99);
    expect(res.body.valore_totale).not.toBeNull();
  });

  it('MANAGER — GET /commessa/:id → valore_totale visibile (9999.99)', async () => {
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
