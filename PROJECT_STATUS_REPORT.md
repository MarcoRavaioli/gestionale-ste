# PROJECT_STATUS_REPORT.md

## 1. 🟢 Fatto (Implementato Correttamente)
- **Database e Architettura Flessibile:** L'applicativo è configurato per puntare a PostgreSQL (sia in `docker-compose.yml` che in `app.module.ts`), abbandonando correttamente SQLite. Le entità supportano le transazioni (ACID) tramite `QueryRunner`.
- **Architettura Frontend (Standalone):** Il frontend Angular 17+ / Ionic 7+ è interamente implementato in modalità Standalone Component (`app.module.ts` non esiste).
- **Adozione Angular Signals e De-strutturazione God Component:** I Subject RxJS sono stati rimossi a favore di Angular Signals in `tab3.page.ts`. L'intero Tab3 è stato destrutturato logicamente importando i Sub-Components (`ListaClientiComponent`, ecc.).
- **Global Error Handling e Sicurezza Base:** Implementazione globale di Helmet, CORS profilato via env, `ValidationPipe` con whitelist rigida e `DataMaskingInterceptor` nativo installato nel `main.ts`.

## 2. 🟡 Da Rifare / Correggere (Implementato con Difetti o Anti-pattern)
- **[CRITICO] Rischio N+1 e God-Relations:** Nel server (`ClienteService`), i metodi `findAll()` e `findOne()` usano ancora l'array esplicito delle `relations` per estrarre alberi di dipendenze massivi e profondi (es. `indirizzi.commesse.appuntamenti`), causando saturazione di memoria backend e innescando l'N+1 issue. *Soluzione:* Passare alla costruzione esplicita limitata in TypeORM `QueryBuilder`.
- **[CRITICO] TypeORM Synchronize:** In `app.module.ts` la proprietà `synchronize: true` è ancora perentoriamente attiva sulla connessione PostgreSQL. Questo è un enorme rischio di data-loss in produzione ad ogni avvio. *Soluzione:* Disattivare il flag e affidarsi alle migrations di TypeORM per i deploy strutturali.
- **[GRAVE] Scroll-Loss Frontend (Tab3):** Il componente Tab3 esegue ancora una chiamata al caricamento globale tramite il webhook `ionViewWillEnter()`. Questo causa un reset della paginazione e scroll tornando all'ingresso nel Tab, violando i requirement dell'action plan anti scroll-loss.
- **[MEDIO] Cancellazione Fisica Allegati Bloccante:** In `ClienteService.remove()`, la procedura fisica della cancellazione file è inglobata all'interno del DB loop principale. Oltre ad essere una violazione del separation of concerns (che richiede l'uso dei TypeORM observer hooks su Entity Allegato), la mancata esistenza del file sul volume non lancia un catch silenzioso corretto ritardando o corrompendo le eliminazioni ricorsive.
- **[MEDIO] Dockerfile Monolitico NestJS:** Il backend image usa ancora una build node root che importa e trascina al suo interno per la produzione tutta la pletora delle dipendenze di dev (`devDependencies`) e source `.ts`. *Soluzione:* Migrare in configurazione `Multi-Stage build`.
- **[MEDIO] Incoerenza Host Nginx:** In `nginx.conf`, il proxy passa l'indirizzo all'host `http://gspose_api:3000/`. Questo viola il RFC standard che preferisce il dash-notation (`gspose-api`) che infatti è il `container_name` di riferimento nel Docker engine.

## 3. 🔴 Mancante (Non ancora implementato completamente)
- **Full-Text Search Server-Side Avanzata:** `findPaginated` non sfrutta nativamente un raggruppamento `Brackets` del `QueryBuilder` esplicito e flessibile per la scansione simultanea multilivello (es: look-over piva o citta in contemporanea al nome).
- **Global Exception Filter Dettagliato:** Nessuna referenza a un custom Global Catch-all `AllExceptionsFilter` nel root module per schermare l'eventuale errore di internal TypeORM in caso di query breaking dirette.
- **Data Masking Attivo verso Privilegi (`INSTALLATORE`):** Il servizio invia ancora le entità piene. Mancano i hook o logiche esplicite per omettere i dati finanziari (`valore_totale`, `fatture`) in base all'utente loggato.
- **Nginx Security Headers (Frontend):** Nel server block nginx in produzione mancano gli step finali per l'indurimento come `X-Frame-Options`, e `Strict-Transport-Security`.
