# Blueprint: Frontend UI/UX Rules (V2)

L'interfaccia di GS Pose V2 DEVE consistere in un'applicazione Angular 17+ ospitata in un container Ionic 7+ progettato rigorosamente Mobile-First, per l'utilizzo sul campo tramite tablet e smartphone da parte di installatori e commerciali.

## 1. Architettura di Navigazione (App Routing)

La navigazione primaria (Tab Bar inferiore) è fissa e divisa logicamente:

- **Tab 1: Dashboard (`/tabs/dashboard`)**: Contiene KPI giornalieri, riepilogo "I miei Appuntamenti di Oggi", e snapshot veloci delle ultime commesse create.
- **Tab 2: Clienti & Cantieri (`/tabs/rubrica`)**: Mappa interattiva o lista gerarchica di anagrafiche, per cercare rapidamente dove andare in trasferta.
- **Tab 3: Archivio Globale (`/tabs/archivio`)**: Il cuore della ricerca aziendale. Ricerca incrociata (piana) su tutte le entità (Fatture, Commesse, Appuntamenti).
- **Tab 4: Impostazioni (`/tabs/settings`)**: Logout profilazione, Dark Mode setup.

Dalla Tab Bar, ogni click drilla in profondità in **Standalone Detail Pages** (`/cliente-dettaglio/:id` ecc), le quali NON devono avere la tab bar visibile (si perde spazio verticale prezioso ai lavoratori), ma una freccia in alto a sinistra "Indietro".

## 2. Reattività Estrema: Angular Signals

La V2 **abbandona `RxJS BehaviorSubject` in favore esclusivo di Angular Signals** per la gestione dello stato UI.

- Tutte le liste visualizzate (eg. l'array di commesse nel Tab3) DEVONO trarre il loro valore da un `signal<Commessa[]>` istanziato in un `Singleton Service`.
- Le Modali che generano un record (`Create/Update`) NON DEVONO chiedere al componente padre di triggerare una fetch server-side se la risorsa non è strettamente dipendente. La Modale compie la `POST` e invia in update il signal originario:
  ```typescript
  // Dopo POST success
  this.commessaService.state.update((old) => [nuovaCommessa, ...old]);
  ```
  L'interfaccia si abbonerà col binding nativo `service.state()`, auto-aggiornandosi istantaneamente all'uscita della modale.

## 3. Gestione Tab 3 (Archivio) - Divieto di Raggruppamento

Nell'Archivio (Tab 3), che carica dataset illimitati tramite Infinite Scroll + Paginazione Server, il paradigma DEVE essere una **"Flat List" (Lista Piatta)**.

- **Divieto di Raggruppamento (Anti-pattern)**: NON raggruppare (`group by`) MAI in tempo reale gli elementi (es. Cliente A -> Lista delle sue commesse) in una view paginata. Se il Server fornisce 15 record misti e l'UI raggruppa, lo scrolling spezzerà i gruppi in base all'ordine in cui arrivano le pagine, rompendo visivamente la lista.
- **Visualizzazione Richiedente**: Ogni Card della lista DEVE bastare a sé stessa, contenendo in un badge o subtitle le informazioni del proprio genitore (Es. Card Commessa con Sottotitolo "Cliente: Rossi SRL / Cantiere: Milano").

## 4. Linee Guida di Form Input & UX

1. I form di creazione DEVONO essere gestiti tramite `ReactiveForms`.
2. Segnalazione immediata degli errori (es. "Il telefono deve essere valido").
3. Il form di creazione e modifica per una singola Entità (es. Appuntamento) DEVE essere centralizzato in UN MODO SOLO (es. `AppuntamentoModalComponent`). Che vi accedi dalla Dashboard o dal Dettaglio Cliente, usi lo stesso componente. Passi un `@Input() clientePreDefinito` per far sì che il form sia furbo e abbia il selettore già agganciato.
4. **Modale degli Allegati**: La gestione dei file di un nodo (es. le foto di un cantiere) si fa ESCLUSIVAMENTE a fondo pagina o con un overlay "Bottom Sheet". L'inserimento dati testuali in alto non deve mai essere occluso. Gli indicatori di caricamento DEVONO mostrare il progresso del parsing.
