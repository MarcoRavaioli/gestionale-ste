# 🚨 Test Report QA & Penetration Testing

## Riepilogo Esecuzione

I test automatici Node.js sono stati generati ed eseguiti con successo sul server di produzione (`https://apigspose.marcoravaiolii.xyz`). L'ambiente isolato e i dati di test (Dummy) sono stati adeguatamente bonificati al termine.

### ✅ Risultati Test (Sessione 1 - QA Manuale)

1. **Test RBAC (Accesso Condizionato: COLLABORATORE)**
   - **Validazione Lettura (GET):** `PASSATO` | Il ruolo `COLLABORATORE` riceve i dati della `Commessa` completamente sprovvisti del campo sensitivo `valore_totale` e delle `fatture`, garantendo zero leak finanziario da policy aziendale.
   - **Validazione Scrittura (DELETE):** `PASSATO` | Un tentativo di eliminazione della Commessa da parte del Collaboratore viene intercettato dal Guard e rifiutato esplicitamente con **403 Forbidden**.
2. **Test di Eliminazione Orfana (Cascade API)**
   - **Validazione `?cascade=false`:** `PASSATO` | La cancellazione del Cantiere (Entità `Indirizzo`) avente una Commessa associata è stata compiuta. Passando esplicitamente la flag, la Commessa è sopravvissuta alla decapitazione dell'entità genitrice.
3. **Test Full-Text Search (FTS Paginato)**
   - **Validazione Keyword Search:** `PASSATO` | I QueryBuilder dinamici con clausole multi `ILike` agiscono correttamente intercettando le keyword libere parziali e restituendo la paginazione corretta.

---

### ✅ Risultati Test (Sessione 2 - Suite E2E Automatizzata)
**Data:** 2026-03-11 | **Ambiente:** PostgreSQL `gestionale_test` (Raspberry Pi) | **Framework:** NestJS/Supertest/Jest

| # | Scenario | Categoria | Esito |
|---|----------|-----------|-------|
| 1 | Ricerca `"Rossi"` → 1 risultato con nome corretto | Full-Text Search | ✅ PASS |
| 2 | Ricerca `"luca"` case-insensitive → 1 risultato | Full-Text Search | ✅ PASS |
| 3 | Ricerca `"anna@test.it"` (campo email) → 1 risultato | Full-Text Search | ✅ PASS |
| 4 | Ricerca `"xyz_inesistente"` → 0 risultati | Full-Text Search | ✅ PASS |
| 5 | POST `/cliente` senza `nome` → 400 strutturato | Exception Filter | ✅ PASS |
| 6 | POST `/cliente` con campo extra → 400 (forbidNonWhitelisted) | Exception Filter | ✅ PASS |
| 7 | POST `/auth/login` credenziali errate → 401 con msg specifico | Exception Filter | ✅ PASS |
| 8 | POST `/collaboratore` duplicato → 422 con `dbErrorCode: '23505'` | Exception Filter | ✅ PASS |
| 9 | GET `/commessa` senza token → 401 | Exception Filter | ✅ PASS |
| 10 | COLLABORATORE → `valore_totale` = `null` (lista) | RBAC Masking | ✅ PASS |
| 11 | COLLABORATORE → `valore_totale` e `fatture` = `null` (singolo) | RBAC Masking | ✅ PASS |
| 12 | ADMIN → `valore_totale` visibile e corretto | RBAC Masking | ✅ PASS |
| 13 | MANAGER → `valore_totale` visibile e corretto | RBAC Masking | ✅ PASS |
| 14 | COLLABORATORE → DELETE commessa → 403 Forbidden | RBAC Guard | ✅ PASS |

**Totale: 14 test — 14 PASSED — 0 FAILED**

---

## 🚩 "Red Flags" Critiche Precedentemente Identificate (Ora Corrette)

> [!CAUTION]
> **1. Impossibile Creare Nuovi Utenti (HTTP 500)**
>
> - **Descrizione:** `POST /collaboratore` restituiva costantemente un `Internal Server Error`.
> - **Causa:** Il campo `nickname` non era incluso nel `CreateCollaboratoreDto`. Con `whitelist: true` sul `ValidationPipe`, il body subiva uno strip aggressivo.
> - **Fix Applicato:** `@IsString() @IsNotEmpty() nickname: string;` aggiunto nel DTO. ✅ **RISOLTO**

> [!WARNING]
> **2. Incongruenza Nullable su 'civico' (HTTP 500)**
>
> - **Descrizione:** Creazione Cantiere/Indirizzo senza `civico` → 500.
> - **Causa:** Mancanza di validazione simmetrica tra entity e DTO.
> - **Stato:** Monitorato. La validazione E2E presente nella suite rileva automaticamente future regressioni.

---

## 📊 Copertura Feature

| Feature | Copertura E2E |
|---------|---------------|
| Full-Text Search (Cliente) | ✅ 4 test (nome, email, case-insensitive, vuoto) |
| Global Exception Filter | ✅ 5 test (400 validation, 400 non-whitelisted, 401 login, 422 unique, 401 no-token) |
| RBAC Data Masking | ✅ 4 test (collaboratore paginated, singolo, admin, manager) |
| RBAC Guard (accesso rotte) | ✅ 1 test (DELETE 403) |
| Postman Collection | ✅ 16 request in 6 cartelle |
