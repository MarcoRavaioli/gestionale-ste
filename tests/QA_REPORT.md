# 🚨 Test Report QA & Penetration Testing

## Riepilogo Esecuzione

I test automatici Node.js sono stati generati ed eseguiti con successo sul server di produzione (`https://apigspose.marcoravaiolii.xyz`). L'ambiente isolato e i dati di test (Dummy) sono stati adeguatamente bonificati al termine.

### ✅ Risultati Test

1. **Test RBAC (Accesso Condizionato: COLLABORATORE)**
   - **Validazione Lettura (GET):** `PASSATO` | Il ruolo `COLLABORATORE` riceve i dati della `Commessa` completamente sprovvisti del campo sensitivo `valore_totale` e delle `fatture`, garantendo zero leak finanziario da policy aziendale.
   - **Validazione Scrittura (DELETE):** `PASSATO` | Un tentativo di eliminazione della Commessa da parte del Collaboratore viene intercettato dal Guard e rifiutato esplicitamente con **403 Forbidden**.
2. **Test di Eliminazione Orfana (Cascade API)**
   - **Validazione `?cascade=false`:** `PASSATO` | La cancellazione del Cantiere (Entità `Indirizzo`) avente una Commessa associata è stata compiuta. Passando esplicitamente la flag, la Commessa è sopravvissuta alla decapitazione dell'entità genitrice (dimostrando l'adozione riuscita della logica Orfana in TypeORM).
3. **Test Full-Text Search (FTS Paginato)**
   - **Validazione Keyword Search:** `PASSATO` | I QueryBuilder dinamici con clausole multi `ILike` agiscono correttamente intercettando le keyword libere parziali e restituendo la paginazione corretta col file test.

---

## 🚩 "Red Flags" Critiche Identificate (Issue di Backend Backend)

Durante la fase di automazione del setup e la costruzione delle transazioni DUMMY sono scaturiti dei bug occulti in cui il sistema backend non espone risposte controllate ma incorre in Hard Crash (HTTP 500):

> [!CAUTION]
> **1. Impossibile Creare Nuovi Utenti (HTTP 500)**
>
> - **Descrizione:** Nessun utente Admin potrà mai creare un nuovo Collaboratore dal pannello. L'API `POST /collaboratore` restituisce costantemente un `Internal Server Error`.
> - **Causa (Diagnosticata a codice):** Il campo `nickname` non è stato incluso nella classe `CreateCollaboratoreDto`. Avendo attivato il `ValidationPipe` Globale con opzione `whitelist: true` nel file `main.ts`, il body della richiesta subisce uno strip aggressivo perdendo il payload relativo al 'nickname'. TypeORM tenta poi di eseguire un `INSERT` nel DB che viene bocciato dal constraint (NotNull) su tale colonna, causando il blocco dell'App.
> - **Fix Immediato:** Integrare `@IsString() @IsNotEmpty() nickname: string;` nel file `backend/src/collaboratore/dto/create-collaboratore.dto.ts`.

> [!WARNING]
> **2. Incongruenza Nullable su 'civico' (HTTP 500)**
>
> - **Descrizione:** La creazione del Cantiere/Indirizzo lancia un errore 500 se nel payload non si invia espressamente il codice topografico `civico`.
> - **Causa:** Il DB impone il constraint strutturale di NON-NULL al field `civico` della tabella `indirizzo`. Dal momento che la mancata compilazione causa uno scoppio 500 e non un 400 Bad Request, vi è assenza di allineamento tra Entity e DTO Validatore. Le API devono fermare l'utente prima con `400` validazione.
> - **Fix Immediato:** Rendere `civico` Required sulla validation DTO _oppure_ abilitare `{ nullable: true }` / default rule sull'Entity.

In virtù delle falle di validazione sui DTO emerse, consiglio di esaminare attentamente che tutti i properties mappati su colonne Database Obbligatorie (`nullable: false`) siano simmetricamente decorati con `@IsNotEmpty()` nel relativo Data Transfer Object di riferimento.
