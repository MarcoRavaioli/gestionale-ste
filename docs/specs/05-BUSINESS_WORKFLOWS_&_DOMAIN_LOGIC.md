# Blueprint: Business Workflows & Domain Logic (V2)

Questo documento definisce l'esatta logica applicativa del "Mondo GS Pose", spiegando in linguaggio naturale come le azioni nel gestionale riflettono il la vita aziendale reale e come i dati fluiscono dal preventivo alla trincea. L'obiettivo è dotare ogni futuro sviluppatore del know-how aziendale senza fargli leggere il vecchio codice.

## Flusso 1: L'Acquisizione (The Entry Point)

Il business origina dal `Cliente`.
L'anagrafica cliente serve come raccoglitore passivo di lavoro. Quando un cliente storico richiede un lavoro, lo sviluppatore non ha bisogno di duplicarlo, ma si limita ad aggiungere alla sua gerarchia un nuovo ramo.

### Creazione Pura (Modello Orfano vs Gerarchico)

In GS Pose, a differenza dei diagrammi rigidi convenzionali, il lavoro può arrivare prima di sapere per quale ditta madre è stato commissionato.

1. **Lavoro con Committente noto**:
   - Creazione Cliente "Tizio SRL".
   - Sotto "Tizio SRL", il sistema crea un Cantiere "Lavori Sede Centrale Roma".
   - Dentro il Cantiere, viene appesa la Commessa "#001 - Posa Parquet".
2. **Lavoro per Pronta Consegna (Modalità Veloce)**:
   - Viene creata immediatamente una Commessa Spontanea. L'utente preme il "+" rapido "Nuova Commessa" nel Tab 3. Compila il Seriale e la descrizione, **salta la selezione Cantiere/Cliente** e preme Save. Questa si definisce l'Entità Svincolata. Servirà un UI flessibile e un DB `nullable` per coprire l'uso frenetico durante le telefonate sul cantiere.
   - Domani, l'amministrazione, dalla medesima Commessa Svincolata, userà la dropdown form "Assegna a Genitore" per posizionarla al suo posto.

## Flusso 2: Ciclo di vita della `Commessa` (Order Lifecycle)

La Commessa attraversa una State Machine. Il campo `stato` è l'ago della bilancia.

- **`APERTA`**: Default alla creazione. Indica l'attesa. Le fatture non possono ancora quadrare (ma possono esserci preventivi in `Allegato`).
- **`IN_CORSO`**: Attivato manualmente o automaticamente dalla creazione di uno step successivo (Es: primo `Appuntamento` inserito schedulato per dopodomani).
- **`CHIUSA`**: La posa è terminata, il bilancio è consolidabile.

## Flusso 3: Interventi sul campo (`Appuntamento`)

Mentre Commessa e Cantiere mappano "cosa e dove", l'`Appuntamento` mappa "chi e quando".

1. **Schedulazione**: Amministrazione apre una Commessa, aggiunge Appuntamento "12 Marzo: Installazione Vetrate".
2. **Assegnazione Multiple**: Ogni appuntamento può avere assegnati un array di `Collaboratore`. La tabella pivot M:N con TypeORM `ManyToMany` traccia la squadra di montatori.
3. **Visibilità Veloce**: Un utente "INSTALLATORE" accedendo alla propria App dal tablet vede la dashboard profilata (Filtro automatico server-side: Appuntamenti dove il mio UserId è tra gli assegnati oggi).

## Flusso 4: Gestione Documentale Assoluta (`Allegato`)

L'azienda carica di tutto: preventivi firmati (PDF), foto del problema (JPG/Cantieri), cedolini, fatture passive.

1. Gli allegati godono di uno schema multi-riferenziale a stella. Un caricamento sa precisamente a quale ID appartenere e le ForeignKey sono mutuamente esclusive.
2. Un caricamento a nome `#Commessa X` diventa reperibile anche dal `Cliente Y` parent, se salendo la struttura ad albero vado a pescare tutti gli allegati child nel backend.
3. Il ciclo vitale coincide col genitore, a meno che non sia forzato all'Hard Delete.
