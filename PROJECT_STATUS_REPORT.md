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
- **Full-Text Search Server-Side Avanzata:** `findPaginated` in tutti i servizi (`ClienteService`, `IndirizzoService`, `CommessaService`, `AppuntamentoService`) utilizza `QueryBuilder` con `Brackets` per la scansione simultanea multi-campo (es: nome+telefono+email per Cliente, via+citta+clienteNome per Cantiere, ecc.). La searchbar del Tab3 resetta correttamente la paginazione prima di re-interrogare il server.
- **Global Exception Filter Dettagliato:** `AllExceptionsFilter` registrato globalmente in `main.ts`. Espone nel JSON di risposta il messaggio di errore specifico, i constraint violation TypeORM/PostgreSQL (campo `detail` e `dbErrorCode`), e gli errori di validation — evitando di mascherarli con generici "Internal Server Error".
- **Data Masking Attivo verso Privilegi (`COLLABORATORE`):** Il `DataMaskingInterceptor` è stato riscritto con logica RBAC: se l'utente autenticato ha ruolo `COLLABORATORE`, i campi finanziari/sensibili (`valore_totale`, `fatture`) vengono impostati a `null` nella response JSON prima che i dati lascino il server. Il log di sistema usa una funzione di oscuramento separata per i campi di log sensibili (`password`, `email`, ecc.).
- **Nginx Security Headers (Frontend):** Nel server block nginx sono state aggiunte le direttive di indurimento: `X-Frame-Options "SAMEORIGIN"`, `Strict-Transport-Security "max-age=31536000; includeSubDomains"`, `X-Content-Type-Options "nosniff"`, e `X-XSS-Protection "1; mode=block"`.

## 2. 🟡 Da Rifare / Correggere (Implementato con Difetti o Anti-pattern)
*(Tutti i debiti tecnici noti al momento sono stati risolti e spostati in Fatto)*

## 3. 🔴 Mancante (Non ancora implementato completamente)
*(Tutti i task precedentemente mancanti sono stati implementati — vedi sezione Fatto)*
