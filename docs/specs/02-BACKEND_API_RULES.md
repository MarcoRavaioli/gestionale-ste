# Blueprint: Backend API Rules (V2 Rewrite)

Queste regole disciplinano lo sviluppo del livello `Controller` e `Service` dell'appicativo NestJS. Non si ammettono compromessi per garantire scalabilità e assenza di side-effects inattesi.

## 1. Pipeline di Validazione (Data Transfer Objects)

Ogni rotta di mutazione (POST, PATCH, PUT) DEVE avere un payload tipizzato attraverso una classe DTO validata con la libreria `class-validator` e `class-transformer`.

- Abilitazione Globale: `ValidationPipe` DEVE essere globale (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`). Non si ammettono campi spazzatura nel JSON.
- Per le `PATCH`, usare la utility `@nestjs/mapped-types` (`PartialType(CreateDto)`) allo scopo di forzare la parzialità e mantenere le regole native di validazione.
- Le chiavi relazionali nel DTO passate per i collegamenti orfani (es. `clienteId: number`) DEVONO essere `@IsOptional() @IsNumber()`. Se viene passato `null`, il Service DEVE procedere a slegare la relazione.

## 2. Standardizzazione Rotte REST

Le rotte plurali e le nomenclature DEVONO seguire un path ben delimitato.
Esempio Router per `Commessa`:

- `GET /commessa/paginated` -> Query `page`, `limit`, `search`. Ritorna `{ data, total, page, limit, totalPages }`.
- `GET /commessa/:id` -> Dettaglio completo, carica TUTTE le dipendenze in eager mode (e.g. gli Allegati figli, il Cliente proprietario).
- `POST /commessa` -> Crea record.
- `PATCH /commessa/:id` -> Aggiorna record e/o sposta le relazioni d'appartenenza.
- `DELETE /commessa/:id?cascade=boolean` -> Soft Delete intelligente.

## 3. Gestione e Firma degli Errori

L'app DEVE adottare un Exception Filter Globale e rigido modo da non leakkare mai strati del database (non si espongono su rete gli alert "QueryFailedError SQL").

- **NotFound**: `throw new NotFoundException('Cliente con ID 123 inesistente')`.
- **Invalid Data**: Gestito automaticamente dal `ValidationPipe` ritorna 400 Bad Request.
- **Conflict/Transactions**: In caso di transazione fallita o vincolo di unique constraint violato (Es. Seriale Commessa già esistente), si catcha l'errore TypeORM e si lancia a mano un `ConflictException` o `InternalServerErrorException` formattato umanamente per l'UI.

## 4. Full-Text Search Server-Side

L'implementazione della ricerca (Query parameter `?search=term`) non è una semplice query `key = value`.
L'API DEVE prevedere un operatore ILIKE case-insensitive intersezionale:

1. Crea l'`alias` base nel TypeORM `QueryBuilder`.
2. Appende eventuali Lookups con `leftJoinAndSelect` verso i genitori.
3. Wrappa tutto con la funzione costruttore formattando `search`: `%{term}%`.
4. Effettua `Brackets(qb => qb.where("X ILIKE :s").orWhere("Y ILIKE :s"))` affinché il raggruppamento logico in SQL sia `WHERE (nome LIKE '%term%' OR piva LIKE '%term%') AND deletedAt IS NULL`. (Il `AND deletedAt IS NULL` è essenziale e deve essere garantito da TypeORM per le query a livello di root - Attenzione che TypeORM non lo applica automaticamente sulle Join esplicite a volte).

## 5. Security - Autenticazione e RBAC

Il sistema è basato su JWT Bearer Tokens.

- **Login Endpoint**: `/auth/login` accetta username o email + password e bypassa i Guards via `@Public()`.
- **Guards**: `JwtAuthGuard` protegge ogni controller by default.
- **Risoluzione Token**: Il payload decodificato DEVE venir iniettato a livello di Request per mappare rapidamente `req.user.ruolo` e `req.user.id`.

### Regole Filtro per Ruolo all'interno dei Service (Data Masking)

L'identità DEVE condizionare non solo _quali API_ puoi invocare (tramite il `@Roles('ADMIN')`), ma anche _come il dato ti viene restituito_.
Nel backend, prima di sputare una fattura o una commessa, si DEVE fare il data masking a seconda del ruolo.
Es: se l'utente è "INSTALLATORE", il service legge `valore_totale` e prima del json di ritorno lo svuota (Setta `valore_totale = undefined`), impedendo così all'operatore di cantiere di sbirciare nel payload web per scoprire l'euro della commessa.

## 6. Accesso e Trasparenza Allegati

La directory virtuale per i files (`/uploads`) è considerata bunkerizzata. Il client non può risalire ai file con un indirizzo http statico http://ip/uploads/nome.pdf.
Esisterà piuttosto un Endpoint protetto:

- `GET /allegato/download/:id`
  Che il framework tradurrà, dopo autenticazione JWT, in streaming col `StreamableFile`.
  Il browser client o Ionic dovranno passare l'header di autenticazione manualmente per avviare il download proxyato.
