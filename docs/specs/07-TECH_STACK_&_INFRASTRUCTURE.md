# Blueprint: Tech Stack & Infrastructure (V2)

Questo documento traccia la baseline tecnologica inderogabile per lo sviluppo della V2 e per la configurazione del Raspberry Pi 5 locale e dei deploy in cloud eventuali.

## 1. Backend

- **Runtime**: Node.js LTS (v20+).
- **Framework**: NestJS v10+. Utilizzo rigoroso del suo sistema di Dependency Injection, Middleware, Pipes e Interceptors.
- **Database**: PostgreSQL 16+. Scalabile, robusto con i vincoli transazionali e ideale per il full-text nativo.
- **ORM**: TypeORM. Consente uno scaling del modello ad oggetti immediato. Abilitare le `migrations` in produzione, e limitare la `synchronize: true` eslusivamente al modulo dev.
- **Storage**: Il salvataggio fisico degli `Allegati` avverrà tramite stream su file system puro mounted tramite volume docker. NestJS `StreamableFile` farà da proxy per la sicurezza.

## 2. Frontend / Mobile

- **Framework Core**: Angular 17+ (o superiore), che introduce il Control Flow `(@if, @for)` e nativamente i `Signals`.
- **UI Toolkit**: Ionic 7+ (o superiore). Mobile-first out of the box, con componenti nativi (Virtual Scroll, Infinite Scroll, Popovers).
- **Architettura**: **Strictly Standalone**. Niente moduli monolitici (`app.module.ts`), ogni componente dichiara i propri imports.
- **Capacitor**: Trattandosi di tablet/telefoni sul campo, Capacitor DEVE essere usato se ci sarà la necessità di interagire con la Camera nativa per l'upload degli Allegati diretti da Cantiere o col FileSystem.

## 3. DevOps e Infrastruttura (Docker)

Il deploy a casa del cliente/sul cloud dovrà avvenire in modalità one-click.
Esisterà un `docker-compose.yml` formale che definisce:

1. **Service `database`**: Immagine `postgres:16-alpine`. Configurazione password e user cablate in `.env`.
2. **Service `backend`**: Build dal Dockerfile NestJS (compilato in `/dist`). Espone la porta `3000`. Dipende temporalmente da `database` passandogli la network flag o un wait script.
3. **Service `frontend_web` (Opzionale nel caso PWA/Web)**: Un web server Nginx leggero (immagine `nginx:alpine`) che serve i file emessi da `ng build` sulla porta `80`.

### Variabili D'Ambiente

Tutte le configurazioni DEVONO avvenire tramite `.env`. Nessuna stringa DB stampata nel codice:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `UPLOAD_DIR` (es. `./uploads`) che in docker-compose si binderà a un volume persistente: `/app/data/uploads:/uploads` per non far sparire i file al riavvio del container.
