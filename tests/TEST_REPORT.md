# QA Penetration & Backend Report — Suite E2E Automatizzata

**Data:** 2026-03-11 | **Framework:** NestJS / Supertest / Jest
**DB di Test:** PostgreSQL `gestionale_test` (Raspberry Pi — isolato da produzione)
**Comando di esecuzione:**
```bash
cd ~/docker-data/gestionale-gspose/backend && npm run test:e2e
```

---

## Full-Text Search (Cliente)

✅ `[1]` Ricerca `"Rossi"` → 1 risultato, `nome === 'Mario Rossi'`
✅ `[2]` Ricerca `"luca"` (case-insensitive) → 1 risultato
✅ `[3]` Ricerca `"anna@test.it"` (campo email) → 1 risultato
✅ `[4]` Ricerca `"xyz_inesistente"` → `total === 0`, `data.length === 0`

---

## Global Exception Filter

✅ `[5]` `POST /cliente` payload vuoto → `400` con `statusCode`, `message`, `timestamp`, `path`
✅ `[6]` `POST /cliente` con campo extra (forbidNonWhitelisted) → `400`
✅ `[7]` `POST /auth/login` credenziali errate → `401`, `message` contiene "credenziali"
✅ `[8]` `POST /collaboratore` nickname duplicato → `422`, `dbErrorCode: '23505'`, `detail` presente
✅ `[9]` `GET /commessa` senza token → `401`

---

## RBAC & Data Masking

✅ `[10]` COLLABORATORE → `GET /commessa/paginated` → ogni item: `valore_totale === null`
✅ `[11]` COLLABORATORE → `GET /commessa/:id` → `valore_totale === null`, `fatture === null`
✅ `[12]` ADMIN → `GET /commessa/:id` → `valore_totale === 9999.99` (visibile)
✅ `[13]` MANAGER → `GET /commessa/:id` → `valore_totale === 9999.99` (visibile)
✅ `[14]` COLLABORATORE → `DELETE /commessa/:id` → `403 Forbidden`

---

## Riepilogo

| Categoria | Test | Passed | Failed |
|-----------|------|--------|--------|
| Full-Text Search | 4 | 4 | 0 |
| Exception Filter | 5 | 5 | 0 |
| RBAC & Masking | 5 | 5 | 0 |
| **TOTALE** | **14** | **14** | **0** |
