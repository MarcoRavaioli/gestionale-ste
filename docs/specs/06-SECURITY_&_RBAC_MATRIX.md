# Blueprint: Security & RBAC Matrix (V2)

Il sistema deve compartimentare rigidamente i dati. Un gestionale moderno deve proteggere sia il dato aziendale dalle query esterne, sia i dati finanziari dagli occhi di chi non deve vederli.

## 1. Classificazione dei Ruoli (Roles)

Il sistema implementa le seguenti classi utente, identificate nell'enum TypeORM `UserRole` e incluse nel payload JWT alla generazione:

- **`ADMIN` (Amministratore / Titolare)**: Ha visibilità illimitata su tutto il sistema. Può creare nuovi utenti, rimuovere record bloccati, vedere il fatturato.
- **`OP_DESK` (Operatore Desk / Backoffice)**: Può creare e gestire Clienti, Cantieri, Appuntamenti, Commesse. Può caricare preventivi e fatture. Non può gestire le utenze di sistema o la configurazione hardware.
- **`INSTALLATORE` (Personale sul Campo)**: Interagisce prevalentemente tramite Mobile/Tablet. Visiona esclusivamente cosa deve fare oggi e domani, gli indirizzi dei cantieri e le note. Può caricare foto a fine lavoro (Allegati). NON HA accesso alla contabilità.

## 2. Matrice delle Autorizzazioni (Access Control Matrix)

La tabella seguente prescrive le policy da implementare nei Controller NestJS (via `@Roles()`) e nella UI Frontend (via `*ngIf="authService.hasRole('ADMIN')"`).

| Entità               | Endpoint Base    | ADMIN | OP_DESK           | INSTALLATORE                 | Note                                                                                     |
| -------------------- | ---------------- | ----- | ----------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| Utenti/Collaboratori | `/collaboratore` | CRUD  | R (Lettori Array) | Nessuno                      | Solo Admin crea utenze.                                                                  |
| Clienti              | `/cliente`       | CRUD  | CRUD              | R (Ricerca Appuntamento)     |                                                                                          |
| Cantieri             | `/indirizzo`     | CRUD  | CRUD              | R (Ricerca Indirizzo)        | L'installatore legge per andare in cantiere.                                             |
| Commesse             | `/commessa`      | CRUD  | CRUD              | R (Solo associate a lui)\*   | L'installatore non vedrà mai la Dashboard Commesse intera.                               |
| Fatture              | `/fattura`       | CRUD  | CRUD              | Accesso Negato               | L'installatore riceve HTTP 403.                                                          |
| Appuntamenti         | `/appuntamento`  | CRUD  | CRUD              | R (Solo propri) / U (Status) | L'installatore può chiudere un appuntamento o aggiungere note.                           |
| Allegati             | `/allegato`      | CRUD  | CRUD              | C (Upload Foto) / R          | L'installatore carica rapportini e foto. Non accede alle cartelle altrui/amministrative. |

## 3. Data Masking in Egress (Protezione Payload)

La sicurezza non si limita all'HTTP 403 su intere rotte. Se un `INSTALLATORE` accede al dettaglio di una `Commessa` a cui è assegnato per oggi, la rotta `/commessa/:id` non è bloccata per lui, ma il dato solido sì.

**Regola del Masking**:
Nel Service o tramite TypeORM `@VirtualColumn()`/Interceptor, prima che il JSON venga sparato al client, i campi finanziari DEVONO essere offuscati o eliminati:

- `commessa.valore_totale` = `undefined`
- Array `fatture[]` = `[]`

## 4. Architettura JWT

- **Scadenza (Expiration)**: Standard 24h.
- **Refresh Token**: Fortemente consigliato per V2 per non de-loggare gli installatori in caso di disconnessioni prolungate sul campo.
- Il token generato DEVE contenere esclusivamente l'`id` utente, il `ruolo` e lo username (nessun array correlato o PII all'interno del Base64).
