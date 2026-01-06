import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from '../../services/indirizzo';
import { CommessaService } from '../../services/commessa.service';
import { Cliente, Indirizzo } from '../../interfaces/models';
import { addIcons } from 'ionicons';
import { 
  businessOutline, 
  personAddOutline, 
  locationOutline, 
  documentsOutline, 
  closeOutline, 
  add, 
  searchOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-nuova-commessa-globale-modal',
  templateUrl: './nuova-commessa-globale-modal.component.html',
  styleUrls: ['./nuova-commessa-globale-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NuovaCommessaGlobaleModalComponent implements OnInit {

  // LISTE PER SELECT
  listaClienti: Cliente[] = [];
  listaCantieri: Indirizzo[] = [];

  // MODALITÀ (Esistente vs Nuovo)
  modeCantiere: 'esistente' | 'nuovo' = 'esistente';
  modeCliente: 'esistente' | 'nuovo' = 'esistente';

  // DATI FORM COMMESSA (Il "Figlio")
  commessa = {
    seriale: '',
    descrizione: '',
    stato: 'APERTA',
    valore_totale: null
  };

  // Selezioni
  selectedCantiereId: number | null = null;
  selectedClienteId: number | null = null;

  // Dati Nuovi (con i campi mancanti aggiunti)
  nuovoCantiere = { 
    via: '', 
    civico: '', 
    citta: '', 
    cap: '', 
    provincia: '', // <--- AGGIUNTO
    stato: 'Italia' 
  };
  
  nuovoCliente = { 
    nome: '', 
    email: '', // <--- ERA GIÀ PRESENTE MA ORA È OBBLIGATORIO NEL TEMPLATE
    telefono: '' 
  };

  constructor(
    private modalCtrl: ModalController,
    private clienteService: ClienteService,
    private indirizzoService: IndirizzoService,
    private commessaService: CommessaService
  ) {
    addIcons({ businessOutline, personAddOutline, locationOutline, documentsOutline, closeOutline, add, searchOutline });
  }

  ngOnInit() {
    this.caricaDati();
  }

  caricaDati() {
    this.clienteService.getAll().subscribe(data => {
      this.listaClienti = data.sort((a, b) => a.nome.localeCompare(b.nome));
    });
    this.indirizzoService.getAll().subscribe(data => {
      // Ordina per città
      this.listaCantieri = data.sort((a, b) => a.citta.localeCompare(b.citta));
    });
  }

  chiudi() { this.modalCtrl.dismiss(); }

  // --- TOGGLE MODES ---
  toggleModeCantiere() {
    this.modeCantiere = this.modeCantiere === 'esistente' ? 'nuovo' : 'esistente';
    this.selectedCantiereId = null;
    this.modeCliente = 'esistente'; // Reset cliente annidato
  }

  toggleModeCliente() {
    this.modeCliente = this.modeCliente === 'esistente' ? 'nuovo' : 'esistente';
    this.selectedClienteId = null;
  }

  // --- LOGICA DI SALVATAGGIO A CASCATA ---
  async salva() {
    try {
      let indirizzoIdFinale: number;

      // STEP 1: OTTIENI ID INDIRIZZO (O DAL SELECT O CREANDOLO)
      if (this.modeCantiere === 'esistente') {
        if (!this.selectedCantiereId) return;
        indirizzoIdFinale = this.selectedCantiereId;
      } else {
        // DOBBIAMO CREARE UN NUOVO CANTIERE
        let clienteIdFinale: number;

        // STEP 1.1: OTTIENI ID CLIENTE
        if (this.modeCliente === 'esistente') {
          if (!this.selectedClienteId) return;
          clienteIdFinale = this.selectedClienteId;
        } else {
          // CREA PRIMA IL CLIENTE
          const clienteCreato = await this.createClientePromise();
          clienteIdFinale = clienteCreato.id;
        }

        // STEP 1.2: CREA IL CANTIERE CON L'ID CLIENTE
        const cantiereCreato = await this.createIndirizzoPromise(clienteIdFinale);
        indirizzoIdFinale = cantiereCreato.id;
      }

      // STEP 2: CREA FINALMENTE LA COMMESSA
      this.creaCommessa(indirizzoIdFinale);

    } catch (error) {
      console.error('Errore durante il salvataggio a cascata', error);
    }
  }

  // Helper Promise wrapper per Cliente
  createClientePromise(): Promise<Cliente> {
    return new Promise((resolve, reject) => {
      this.clienteService.create(this.nuovoCliente).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(err)
      });
    });
  }

  // Helper Promise wrapper per Indirizzo
  createIndirizzoPromise(clienteId: number): Promise<Indirizzo> {
    const payload = { ...this.nuovoCantiere, cliente: { id: clienteId } } as any;
    return new Promise((resolve, reject) => {
      this.indirizzoService.create(payload).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(err)
      });
    });
  }

  creaCommessa(indirizzoId: number) {
    const payload = { ...this.commessa, indirizzo: { id: indirizzoId } } as any;
    this.commessaService.create(payload).subscribe({
      next: (res) => this.modalCtrl.dismiss({ creato: true, data: res }),
      error: (err) => console.error(err)
    });
  }

  // Validazione Form
  isValid(): boolean {
    const baseCommessaValid = this.commessa.seriale && this.commessa.stato;
    
    // Se la parte commessa non è valida, è inutile controllare il resto
    if (!baseCommessaValid) return false;

    if (this.modeCantiere === 'esistente') {
      return !!this.selectedCantiereId;
    } else {
      // Validazione Nuovo Cantiere (Via e Città obbligatori)
      const addrValid = this.nuovoCantiere.via && this.nuovoCantiere.citta;
      
      if (this.modeCliente === 'esistente') {
        return !!(addrValid && this.selectedClienteId);
      } else {
        // Validazione Nuovo Cliente (Nome obbligatorio)
        return !!(addrValid && this.nuovoCliente.nome);
      }
    }
  }
}
