# PROJECT_STATUS_REPORT.md

## 1. 🟢 Fatto (Implementato Correttamente)
- **Database e Architettura Flessibile:** L'applicativo è configurato per puntare a PostgreSQL (sia in `docker-compose.yml` che in `app.module.ts`), abbandonando correttamente SQLite. Le entità supportano le transazioni (ACID) tramite `QueryRunner`.
- **Architettura Frontend (Standalone):** Il frontend Angular 17+ / Ionic 7+ è interamente implementato in modalità Standalone Component (`app.module.ts` non esiste).
- **Adozione Angular Signals e De-strutturazione God Component:** I Subject RxJS sono stati rimossi a favore di Angular Signals in `tab3.page.ts`. L'intero Tab3 è stato destrutturato logicamente importando i Sub-Components (`ListaClientiComponent`, ecc.).
- **Risoluzione N+1 e God-Relations:** Nel server (`ClienteService`), eliminato l'uso esplicito dell'array `relations` passando al `QueryBuilder` per performance ottimali.
- **Disattivazione TypeORM Synchronize:** Migrazione alla gestione tramite file fisici `migrations`, disattivando in sicurezza `synchronize: false` su Postgres.
- **Scroll-Loss Frontend (Tab3):** Rimozione refresh bloccante da `ionViewWillEnter()` e adozione segnali reattivi per persistenza scroll.
- **Cancellazione Allegati Asincrona:** Migrazione a `@AfterRemove` hook TypeORM e unlink asincrono fs, evitando blocchi al loop DB.
- **Ottimizzazione Dockerfile NestJS:** Adozione `Multi-Stage build` nel backend per decurtazione drastica del container di produzione.
- **Fix Incoerenza Nginx Proxy:** Allineamento hostname backend a strict RFC (`gspose-api`) nel container resolve `nginx.conf`.

## 2. 🟡 Da Rifare / Correggere (Implementato con Difetti o Anti-pattern)
*(Tutti i debiti tecnici noti al momento sono stati risolti e spostati in Fatto)*

## 3. 🔴 Mancante (Non ancora implementato completamente)
- **Full-Text Search Server-Side Avanzata:** `findPaginated` non sfrutta nativamente un raggruppamento `Brackets` del `QueryBuilder` esplicito e flessibile per la scansione simultanea multilivello (es: look-over piva o citta in contemporanea al nome).
- **Global Exception Filter Dettagliato:** Nessuna referenza a un custom Global Catch-all `AllExceptionsFilter` nel root module per schermare l'eventuale errore di internal TypeORM in caso di query breaking dirette.
- **Data Masking Attivo verso Privilegi (`INSTALLATORE`):** Il servizio invia ancora le entità piene. Mancano i hook o logiche esplicite per omettere i dati finanziari (`valore_totale`, `fatture`) in base all'utente loggato.
- **Nginx Security Headers (Frontend):** Nel server block nginx in produzione mancano gli step finali per l'indurimento come `X-Frame-Options`, e `Strict-Transport-Security`.
