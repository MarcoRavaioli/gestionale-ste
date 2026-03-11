# PROJECT_STATUS_REPORT: 360° Gap Analysis & Code Review

Questo documento riflette lo stato reale dei lavori del progetto "gestionale-gspose" confrontato con le direttive architetturali (V2), valutato in modo omnicomprensivo su backend, frontend e infrastruttura.

## 🟢 FATTO (Implementato Correttamente)
- **Architettura a Grafo Flessibile (Backend):** Le entità TypeORM (`Cliente`, `Indirizzo`, `Commessa`, `Appuntamento`, `Allegato`) sono state modellate correttamente con relazioni flessibili e `nullable: true` (es. Orfani supportati). Presente anche il Soft Delete tramite `@DeleteDateColumn`.
- **Transazioni ACID Base:** Il backend sfrutta la transazionalità manuale (`QueryRunner`) in service chiave come `ClienteService` per salvataggi multipli, garantendo l'assenza di scritture parziali.
- **Paginazione Server-Side:** I Service espongono logiche di fetching frazionato (es. `findAndCount` con ottimizzazioni in parallelo) sfruttate nei metodi `getPaginated()`.
- **Integrazioni Frontend Angular 17+:** Impiego corretto di architettura moderna `standalone: true` in quasi tutta la UI frontend (es. Tab3Page).

## 🟡 DA RIFARE / CORREGGERE (Debito Tecnico e Violazioni)
1. **[Backend/Infrastruttura] Bipolarità Database (SQLite vs PostgreSQL):** Il `docker-compose.yml` usa un mount locale per il DB (`DATABASE_FILE=/app/data/gestionale.db`) come se fosse SQLite, pur dichiarando `type: 'postgres'` nel config dell'`AppModule`.
2. **[Backend] Rischio Catastrofico `synchronize: true`:** Nel `backend/src/app.module.ts`, la connessione TypeORM ha la direttiva `synchronize: true` attiva assieme a `migrationsRun: true`. Un rischio DevOps inaccettabile che può recare danni irreparabili ai dati in produzione per via della drop spontanea.
3. **[Frontend] God Component "Tab3" (`tab3.page.ts`):** Il file è un monolite mastodontico di quasi 600 righe. Gestisce lo stato globale paginato, le searchbar, la navigazione modale e la logica di filtering per ben 5 domini diversi simultaneamente, violando il Single Responsibility Principle.
4. **[Backend] Rischio N+1 Query nelle Relazioni Deep:** Il `ClienteService` (sia in `findOne` che `findAll`) esegue fetch massivi di alberi genealogici caricando esplicitamente string array come `indirizzi.commesse.appuntamenti`. 
5. **[DevOps] Dockerfile "Single Stage":** L'immagine Docker del backend è grezza, includendo all'interno del layer finale sorgenti in Typescript non compilati ed estesi node_modules di sviluppo, fallendo sul piano della sicurezza.
6. **[Mix/Rete] Nginx vs Docker DNS Mismatch:** `nginx.conf` inoltra le API proxyate a `http://gspose_api:3000` (con *underscore*), mentre il `docker-compose.yml` battezza il servizio `gspose-api` (con il *trattino*). Causando un inevitabile `502 Bad Gateway`.

## 🔴 MANCANTE (Assenze bloccanti per la V2 / Produzione)
- **Container PostgreSQL Autonomo:** Manca formalmente l'immagine `postgres:16-alpine` in `docker-compose.yml` richiesta dalle specs.
- **Data Masking (Protezione Payload):** Nessun meccanismo interceptor, in Egress, sfoltisce o oscura i dati finanziari o aggregati (`valore_totale` ecc) dalle API destinate agli `INSTALLATORI`, mancando il vincolo imposto in `06-SECURITY_&_RBAC_MATRIX.md`.
- **Global Exception Filter:** Manca l'handler globale (`AllExceptionsFilter`) in NestJS per catturare in sordina gli hint SQL TypeORM e convertire tutto in un Response standard `Http 500` pulito verso i Client.
- **Sistema Decoratori Ruolo `@Roles()`:** Mancanza di un wrapper di validazione dei ruoli, complementare alla `JwtAuthGuard` attuale, per vietare la mutazione di controller specifici alle utenze base.
- **QueryBuilder Paginato (Full Text Server Side):** La ricerca per tabulato base usa solo `ILike` nativo incrociando stringhe pure, e non implementa l'intersezione Full-Text Search (es. Nome Appuntamento + Città Cantiere congiunto) richiesta nei docs d'analisi.
