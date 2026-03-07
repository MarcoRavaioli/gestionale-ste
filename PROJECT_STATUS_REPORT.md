# PROJECT_STATUS_REPORT.md

## 1. 🟢 Executive Summary (Cosa abbiamo oggi)

- **Architettura a Grafo Flessibile:** Il modello dati gestisce flessibilmente le entità (Clienti, Indirizzi, Commesse, Appuntamenti), supportando correttamente sia relazioni gerarchiche profonde che entità orfane.
- **Transazioni ACID (Backend):** Utilizzo corretto di `QueryRunner` di TypeORM implementato all'interno dei service (`ClienteService`, ecc.) per garantire operazioni di scrittura atomiche e tolleranti agli errori, prevenendo scritture parziali in caso di eccezioni.
- **Paginazione Server-Side Mista:** Il layer infrastrutturale per il fetching frazionato è presente lato backend ed è sfruttato proattivamente nel frontend tramite l'Infinite Scroll (es. sulla `Cliente.findPaginated` con `findAndCount` ottimizzato).
- **Sicurezza Base e Logging:** `Helmet` è implementato per manipolare gli header e i CORS sono impostati selettivamente. Notevole uso di Winston per il parsing strutturato e rotazione log (`DailyRotateFile`), supportato dal `DataMaskingInterceptor` globale che maschera PII (Personally Identifiable Information).

## 2. 🛠️ Refactoring Necessario (Debito Tecnico)

- **[CRITICO] Bipolarità Database (SQLite vs PostgreSQL):** Da architettura, il requirement è `PostgreSQL`. Tuttavia, nel `docker-compose.yml`, il mount points del backend sta puntando chiaramente a un file fisico locale `DATABASE_FILE=/app/data/gestionale.db` (tipico setup SQLite). _Soluzione:_ Uniformare lo stack e aggiungere un orchestratore PostgreSQL nel branch DevOps.
- **[CRITICO] TypeORM `synchronize: true`:** Nel `backend/src/app.module.ts`, la connessione Postgres ha la flag `synchronize: true`. In produzione questo è un rischio DevOps imperdonabile (qualsiasi schema update potrebbe radere al suolo le tabelle per re-crearle incautamente, causando la perdita catastrofica dei dati). _Soluzione:_ Impostare su `false` ed eseguire il deploy esclusivamente tramite Migrations formalizzate (`TypeORM Migrations`).
- **[CRITICO] "God Component" Frontend (`Tab3Page`):** Il file `tab3.page.ts` è un monolito mastodontico di oltre 700 righe di TypeScript. Fonde indebitamente logiche di UI, preferenze utente, paginated state locale per Clienti/Cantieri e "in-memory fetching" per 4 flussi dati separati, violando palesemente il _Single Responsibility Principle_. _Soluzione:_ Decostruzione immediata in Smart/Dumb Components standalone coordinati da Injectable Stores basati su **Angular Signals**.
- **[ALTO] Memory Leaks e Colli di Bottiglia Frontend:** Mentre i Clienti usano il lazy loading (`getPaginated`), il tab3 estrae l'intera massa dati relazionale in avvio per Commesse e Appuntamenti trasferendo il carico sulla cache del client (`this.commessaService.getAll()`, `this.appService.getAll()`). Appena il volume crescerà, esploderà l'inbox RAM del browser, rallentando brutalmente il rendering dell'intero tab.
- **[ALTO] Rischio N+1 nelle Relazioni Deep:** Nei metodi `findAll()` e `findOne()` del `ClienteService`, vengono caricate con l'array implicito (e massivo) delle `relations` tutte le dipendenze figlie e nipoti (es. `indirizzi.commesse.appuntamenti`). TypeORM gestisce malissimo questa estrazione e rischia di innescare il classico problema _N+1_ o l'assoluta saturazione dell'event-loop per i cross-join esagerati. _Soluzione:_ Sostituzione con il `QueryBuilder` sfruttando joins condizionali e specifici attributi di selezione lato server.
- **[MEDIO] Dockerfile Backend Inefficiente:** Il contenitore Node originato `backend/Dockerfile` è una build "single-stage". Carica al suo interno file TypeScript sorgenti integrali e la mole completa dei `node_modules` (inclusi quelli di sviluppo). Questo genera un'immagine mastodontica e vulnerabile (rischio path injection e superficie d'attacco maggiorata). _Soluzione:_ Applicare le Multi-Stage Builds mantenendo esclusivamente le dipendenze `prod` e compilando solo il folder `dist/`.
- **[MEDIO] Incoerenza di Rete Nginx / Docker:** Nel config proxy nativo (`frontend/nginx.conf`), il routing della porta inoltra `http://gspose_api:3000/`. Nel compose il container è descritto normato con la string-dash `gspose-api`. È imperativo allineare il DNS resolution interno per non incappare in `502 Bad Gateway`.

## 3. 🚀 Roadmap for Final Deployment (Cosa manca)

**A. Database e Backend (NestJS / TypeORM)**

- [ ] Rimuovere l'ombra di SQLite, creare un Service robusto PostgresSQL via Docker, e attivare i seeders asincroni.
- [ ] Forzare su `false` il `synchronize` in `app.module.ts`, inizializzare le cartelle di compilazione `src/migrations/` in deploy.
- [ ] Creazione di un `AllExceptionsFilter` (catch-all global exception filter) per normalizzare i fault error su un HTTP 500 generico ed evitare trapelamenti in rete di Stack Error ai payload client.
- [ ] Refactoring del metodo TypeORM in `ClienteService`. Riscrivere `findAll()` per supportare `createQueryBuilder('cliente')` con limitazione estrema all'idratamento di colonne inattese (solo le stringhe minime per l'UI tabellare).

**B. Frontend e Architettura Client (Angular 17+)**

- [ ] Spezzettare chirurgicamente il `tab3.page.ts` in flussi UI di tipo "Route basata Standalone Object" sfruttando gli slot modali o il nuovo Angular Router.
- [ ] Transizione da archivi "In-Memory" ad API server-side per tutti gli Array (`Commesse` e `Appuntamenti` esigono un query handler backend con limitazione `search` e `page`).
- [ ] Migrare la Single State Source UI ai nuovi primitivi `Signals`, abbandonando subject custom e i cicli infiniti di property bindings manuali per triggerare la Change Detection locale molto più chirurgicamente.
- [ ] Assicurarsi che ogni touch target o Action Button su Ionic si certifichi allo standard mobile (44px/48px) e che i placeholder siano skeleton-styled se i tempi di payload aumentano.

**C. DevOps e Sicurezza Perimetrale (Nginx, Docker, Cloudflare)**

- [ ] Scrivere e collaudare le istruzioni Multi-Stage sul `backend/Dockerfile`.
- [ ] Rafforzare `frontend/nginx.conf` inserendo le header security standard di HSTS (`Strict-Transport-Security`), preclusione inneschi in form Mime (`X-Content-Type-Options: nosniff`) ed evitando iframe (`X-Frame-Options: SAMEORIGIN`).
- [ ] Attivare `app.set('trust proxy', 1);` o equivalente (per chi usa NestJS con Fastify o Express) dato che la richiesta è intercettata in LAN dal Cloudflare Tunnel: essenziale se il Backend vuole tracciare metriche del vero IP esterno (anti brute-force), altrimenti le risposte si basano su un IP univoco proxy che invaliderà i rate limiters reali.

## 4. ❓ Questioni Aperte per il Tech Lead

1. **Hosting Database Ufficiale:** Il deploy finale richiederà lo stivaggio di database su PostgreSQL tramite Container interno nel nostro stack locale o useremo un PaaS Esterno in Cloud (es. Supabase / RDS AWS)? Dobbiamo confermare lo svincolo da SQLite.
2. **Ciclo di Vita dei Nodi "Orfani" (Business Logic):** Abbiamo permesso al modello a "Grafo Flessibile" di persistere. Qualora ci si aspettti il "Soft Delete" massivo di un `Cantiere`, cosa dovrebbe accedere per propagazione agli `Appuntamenti` correlati? La direttiva dovrà triggerare la cascade automatica soft delete o rimarranno nel backlog "senza cantiere" come allert operativo visibile in bacheca ai Manager?
3. **Paginazione Flessibile Frontend/Backend:** Per i filtri globali (searchbar comune), si intende che le query server-side per gli `Appuntamenti` scansionino il backend in logica FTS (Full Text Search) con look-over cross-tabella simultaneo (nome cliente + nome appuntamento + città) prima di fare return, o è preferibile filtrare solo su keyword isolate mantenendo basso il carico QueryBuilder?
4. **Resilienza (Progressive Web App):** E' atteso un modulo di cache di lettura asincrona Service Workers per gli esterni su strada interrotta? Gli incaricati hanno necessità stretta di consultare la planimetria o elenco Appuntamenti sul posto se Cloudflare Tunnel non è raggiungibile in rete debole? Costruiremo i layer offline storage tramite IndexDB o bypassiamo?
