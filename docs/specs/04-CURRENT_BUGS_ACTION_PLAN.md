# Blueprint: Action Plan & Anti-Patterns (V2 Rewrite)

La riscrittura da zero ("V2") del Gestionale GS Pose non deve essere solo un esercizio stilistico, ma un superamento sistematico degli anti-pattern tecnici che hanno appesantito la V1 causando instabilità, perdite di stato e crash in produzione.

Di seguito i principali problemi storici mappati in "Cosa NON fare". L'ingegneria V2 si baserà sull'avoidance di queste prassi.

## 🔴 1. Scroll-Loss e Ricaricamento Forzato Cieco

**Il problema in V1:** Nel ciclo di vita di Ionic, molte tab (es. Tab 3 Archivio) usavano l'evento `ionViewWillEnter()` per eseguire chiamate incondizionate di fetch totali (`GET /paginated?page=1`). Risultato: ogni qual volta un utente andava in una pagina di dettaglio per visualizzare una fattura, al ritorno premeva la "Freccia Indietro", e l'app resettava l'archivio perdendo lo scroll che faticosamente aveva esteso fino a pagina 5. Un disastro per l'usabilità aziendale.

**La Regola in V2:**

- L'evento in entrata **NON DEVE** resettare lo stato di una lista paginata se questa è già popolata.
- L'utilizzo di `Angular RouteReuseStrategy` o la permanenza organica dei component root in Ionic (se configurato bene con Standalone components) consentirà alla RAM di mantenere in cache l'ultimo stato visitato. Il ripristino dei dati freschi si fa solo col Pull-to-Refresh manuale.

## 🔴 2. I/O Loop nel Salvataggio Files a Cascata (Hard Delete Multiplo)

**Il problema in V1:** I servizi Backend TypeORM eseguivano le Soft Delete ciclando su ogni child-array. In caso di `cascade=true` per gli `Allegato`, il backend estraeva i file in array JS, eseguiva un `try/catch` per onguno avviando chiamate sincrone `fs.unlinkSync()`, e infine committava la cancellazione dal DB. Se un file sollevava ERNOENT (esiste in DB ma perso su disco), il loop bloccava l'eliminazione a cascata, generando orphan dead-data.

**La Regola in V2:**

- Separare e disaccoppiare. L'Entity Model di `Allegato` o il suo Custom Repository Controller **DEVE** assumersi la logica di distruzione fisica via `@BeforeRemove` o `@AfterRemove` Hook (Observer) incapsulato in Service unificato. Gli errori di I/O (file non trovato su disco locale) **DEVONO ESSERE SILENZIATI** a livello filesystem per permettere all'eliminazione SQL di proseguire regolarmente e tenere pulito il database.

## 🔴 3. Spaghetti Imports e Architettura Monolitica Frontend

**Il problema in V1:** Frontend strutturato a Moduli Angular pesanti (o mix confuso) e template giganti in una singola pagina.

**La Regola in V2:**

- L'applicazione V2 **DEVE nascere e crescere in puro Standalone Component Mode** (`standalone: true` ovunque). Nessun file `app.module.ts`.
- Ogni porzione di UI (Es. la formattazione della card Cliente) DEVE essere un componente isolato (`<app-cliente-card>`). Questo riduce paurosamente i merge conflicts git e standardizza la visualizzazione sia che venga usata nel Tab 1, che nel Dettaglio Commessa.

## 🔴 4. Vulnerabilità e Polimorfismo Fittizio nelle Query

**Il problema in V1:** Tentativi di eseguire update generici passando campi opzionali incerti tra le entities senza validazioni.
**La Regola in V2:** Usare sempre DTO rigidi generati per entità (Es. `UpdateCommessaDto`). La sicurezza dell'input non deve essere un _nice-to-have_. Un campo `valore_totale` manipolato lato Client con dev tools browser NON DEVE poter esser iniettato da un Installatore senza privilegi a cui, magari, l'endpoint era esposto senza filtri DTO.
