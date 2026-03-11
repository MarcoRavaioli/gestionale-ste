# PROJECT_STATUS_REPORT.md

## 1. 🟢 Fatto (Implementato Correttamente)
- **Database e Architettura Flessibile:** Configurato per PostgreSQL con `synchronize: false` e migrations.
- **Architettura Frontend (Standalone):** Angular 17+ / Ionic 7+ in modalità Standalone Component.
- **Angular Signals e De-strutturazione God Component:** Tab3 destrutturato con Sub-Components e Angular Signals.
- **Risoluzione N+1 e God-Relations:** `QueryBuilder` usato in tutti i servizi chiave.
- **Scroll-Loss Frontend (Tab3):** Nessun refresh bloccante, segnali reattivi per persistenza scroll.
- **Cancellazione Allegati Asincrona:** `@AfterRemove` hook TypeORM con unlink fs asincrono.
- **Ottimizzazione Dockerfile NestJS:** Multi-Stage build nel backend.
- **Fix Incoerenza Nginx Proxy:** Hostname backend allineato a strict RFC.
- **Full-Text Search Server-Side:** `findPaginated` in tutti i servizi usa `QueryBuilder` + `Brackets` multi-campo.
- **Global Exception Filter Dettagliato:** `AllExceptionsFilter` espone constraint violation TypeORM/PostgreSQL nel JSON.
- **Data Masking COLLABORATORE:** `DataMaskingInterceptor` RBAC — `valore_totale` e `fatture` a `null` per COLLABORATORE.
- **Nginx Security Headers:** `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-XSS-Protection`.
- **Fix Path Traversal su `/uploads`:** `resolve()` + `startsWith(UPLOADS_BASE)` — URL come `../../etc/passwd` → 400.
- **Fix Privilege Escalation Ruolo:** Solo ADMIN può modificare il campo `ruolo` in `CollaboratoreController`.
- **Rate Limiting Anti Brute-Force:** `ThrottlerModule` globale (100 req/60s), login ristretto a 5/60s via `@Throttle`.
- **ValidationPipe `forbidNonWhitelisted`:** Campi extra nel DTO → 400 esplicito.
- **Fix `simple-enum` su PostgreSQL:** `fattura.entity.ts` allineato a `type: 'enum'` nativo Postgres (la migration lo creava già correttamente).
- **Refactoring `FatturaService` allegati:** Eliminati `@ts-ignore` e `as any` — gli allegati sono ora creati tramite `AllegatoRepository.create()` come entità TypeORM complete con `tipo_file` e relazione corretta.
- **Ordinamento Server-Side Globale:** Tutti e 4 i `findPaginated` (Cliente, Cantiere/Indirizzo, Commessa, Appuntamento) ora accettano `orderBy` e `orderDirection` con whitelist sicura. I 4 controller backend e i 4 servizi Angular li passano end-to-end. L'ordinamento avviene sul dataset completo, non sulla singola pagina.
- **Gestione JWT Scaduto (Frontend):** `JwtInterceptor` gestisce il 401 con `localStorage.removeItem` + redirect al login. `AuthService.decodificaEImpostaUtente` controlla `decoded.exp` all'avvio.

## 2. 🟡 Da Rifare / Correggere
*(Nessun debito tecnico noto non indirizzato)*

## 3. 🔴 Mancante
*(Tutti i task implementati)*

---

## 4. ⚠️ Possibili Miglioramenti Futuri
- **Gestione UI del JWT scaduto mid-session:** Notifica utente visibile (toast) invece del redirect silenzioso quando il token scade mentre l'app è in uso.
- **Refresh Token:** Endpoint dedicato per rinnovare il JWT senza re-login (richiede modifica del flusso auth e una tabella RefreshToken nel DB).
- **Test automatici:** I file `.spec.ts` sono template vuoti — aggiungere test unitari per servizi e controller.
- **Rate limiting più granulare:** Diversificare i limiti per endpoint (es. upload file, ricerca, ecc.) con strategie personalizzate.
