import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { CommessaService } from '../../services/commessa.service';
import { AppuntamentoService } from '../../services/appuntamento.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { Cliente, Indirizzo, Commessa } from '../../interfaces/models';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  documentsOutline,
  locationOutline,
  personAddOutline,
  closeOutline,
  searchOutline,
  add,
  chevronDownOutline,
  checkmarkCircle
} from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-appuntamento-globale-modal',
  templateUrl: './nuovo-appuntamento-globale-modal.component.html',
  styleUrls: ['./nuovo-appuntamento-globale-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, GenericSelectorComponent],
})
export class NuovoAppuntamentoGlobaleModalComponent implements OnInit {
  @Input() dataIniziale?: string;

  // LISTE DATI
  listaCommesse: Commessa[] = [];
  listaCantieri: Indirizzo[] = [];
  listaClienti: Cliente[] = [];
  filteredCommesse: Commessa[] = [];

  // MODALITÀ (Toggles)
  modeCommessa: 'esistente' | 'nuova' = 'esistente';
  modeCantiere: 'esistente' | 'nuovo' = 'esistente';
  modeCliente: 'esistente' | 'nuovo' = 'esistente';

  // SELEZIONI
  selectedCommessaId: number | null = null;
  selectedCantiereId: number | null = null;
  selectedClienteId: number | null = null;

  // DATI FORM (Oggetti Nuovi)
  appuntamento = { nome: '', data_ora: '', descrizione: '' };
  nuovaCommessa = {
    seriale: '',
    descrizione: '',
    stato: 'APERTA',
    valore_totale: null,
  };
  // Aggiunti campi mancanti per coerenza
  nuovoCantiere = {
    via: '',
    civico: '',
    citta: '',
    cap: '',
    provincia: '',
    stato: 'Italia',
  };
  nuovoCliente = { nome: '', email: '', telefono: '' };

  constructor(
    private modalCtrl: ModalController,
    private cliService: ClienteService,
    private indService: IndirizzoService,
    private comService: CommessaService,
    private appService: AppuntamentoService
  ) {
    addIcons({
      calendarOutline,
      documentsOutline,
      locationOutline,
      personAddOutline,
      closeOutline,
      searchOutline,
      add,
      chevronDownOutline,
      checkmarkCircle,
    });
  }

  ngOnInit() {
    // Caricamento parallelo dati
    this.cliService
      .getAll()
      .subscribe(
        (d) =>
          (this.listaClienti = d.sort((a, b) => a.nome.localeCompare(b.nome)))
      );
    this.indService
      .getAll()
      .subscribe(
        (d) =>
          (this.listaCantieri = d.sort((a, b) =>
            a.citta.localeCompare(b.citta)
          ))
      );
    this.comService
      .getAll()
      .subscribe(
        (d) =>
          (this.listaCommesse = d.sort((a, b) =>
            a.seriale.localeCompare(b.seriale)
          ))
      );

    this.comService.getAll().subscribe((d) => {
      this.listaCommesse = d.sort((a, b) => a.seriale.localeCompare(b.seriale));
      this.filteredCommesse = [...this.listaCommesse]; // Inizializza la lista filtrata
    });

    if (this.dataIniziale) {
      this.appuntamento.data_ora = this.dataIniziale;
    } else {
      // Fallback: se non passata, usa ora attuale ma togliendo i secondi per compatibilità HTML
      // (Oppure lasciala vuota, ma per coerenza meglio settarla)
      const now = new Date();
      now.setSeconds(0, 0);
      // toISOString() restituisce UTC, per i datetime-local serve formato locale "YYYY-MM-DDTHH:mm"
      // Per semplicità usiamo un trucco per il fuso orario locale
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      this.appuntamento.data_ora = localIso;
    }
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  // TOGGLES - Reset a cascata
  toggleModeCommessa() {
    this.modeCommessa =
      this.modeCommessa === 'esistente' ? 'nuova' : 'esistente';
    this.selectedCommessaId = null;
    this.modeCantiere = 'esistente';
  }

  toggleModeCantiere() {
    this.modeCantiere =
      this.modeCantiere === 'esistente' ? 'nuovo' : 'esistente';
    this.selectedCantiereId = null;
    this.modeCliente = 'esistente';
  }

  toggleModeCliente() {
    this.modeCliente = this.modeCliente === 'esistente' ? 'nuovo' : 'esistente';
    this.selectedClienteId = null;
  }

  // --- SALVATAGGIO A CASCATA ---
  async salva() {
    try {
      let commessaIdFinale: number;

      // 1. GESTIONE COMMESSA
      if (this.modeCommessa === 'esistente') {
        if (!this.selectedCommessaId) return;
        commessaIdFinale = this.selectedCommessaId;
      } else {
        // CREA NUOVA COMMESSA
        let indirizzoIdFinale: number;

        // 2. GESTIONE CANTIERE
        if (this.modeCantiere === 'esistente') {
          if (!this.selectedCantiereId) return;
          indirizzoIdFinale = this.selectedCantiereId;
        } else {
          // CREA NUOVO CANTIERE
          let clienteIdFinale: number;

          // 3. GESTIONE CLIENTE
          if (this.modeCliente === 'esistente') {
            if (!this.selectedClienteId) return;
            clienteIdFinale = this.selectedClienteId;
          } else {
            // CREA NUOVO CLIENTE
            const cli = await this.wrap(
              this.cliService.create(this.nuovoCliente)
            );
            clienteIdFinale = cli.id;
          }

          // Crea Cantiere
          const indPayload = {
            ...this.nuovoCantiere,
            cliente: { id: clienteIdFinale },
          } as any;
          const ind = await this.wrap(this.indService.create(indPayload));
          indirizzoIdFinale = ind.id;
        }

        // Crea Commessa
        const comPayload = {
          ...this.nuovaCommessa,
          indirizzo: { id: indirizzoIdFinale },
        } as any;
        const com = await this.wrap(this.comService.create(comPayload));
        commessaIdFinale = com.id;
      }

      // 4. CREA APPUNTAMENTO
      const appPayload = {
        ...this.appuntamento,
        commessa: { id: commessaIdFinale },
      } as any;

      this.appService.create(appPayload).subscribe({
        next: (res) => this.modalCtrl.dismiss({ creato: true, data: res }),
        error: (err) => console.error(err),
      });
    } catch (err) {
      console.error('Errore cascata', err);
    }
  }

  // Helper per trasformare Observable in Promise
  wrap(obs: any): Promise<any> {
    return new Promise((resolve, reject) => {
      obs.subscribe({
        next: (res: any) => resolve(res),
        error: (err: any) => reject(err),
      });
    });
  }

  isValid(): boolean {
    // 1. Controllo Appuntamento
    if (!this.appuntamento.nome) {
      return false;
    }
    if (!this.appuntamento.data_ora) {
      return false;
    }

    // 2. Controllo Commessa
    if (this.modeCommessa === 'esistente') {
      if (!this.selectedCommessaId) {
        return false;
      }
    } else {
      // Nuova Commessa
      if (!this.nuovaCommessa.seriale) {
        return false;
      }

      // 3. Controllo Cantiere
      if (this.modeCantiere === 'esistente') {
        if (!this.selectedCantiereId) {
          return false;
        }
      } else {
        // Nuovo Cantiere
        if (!this.nuovoCantiere.via || !this.nuovoCantiere.citta) {
          return false;
        }

        // 4. Controllo Cliente
        if (this.modeCliente === 'esistente') {
          if (!this.selectedClienteId) {
            return false;
          }
        } else {
          // Nuovo Cliente
          if (!this.nuovoCliente.nome) {
            return false;
          }
        }
      }
    }

    // Tutto OK
    return true;
  }

  filterCommesse(ev: any) {
    const term = ev.target.value?.toLowerCase();
    if (!term) {
      this.filteredCommesse = [...this.listaCommesse];
      return;
    }
    this.filteredCommesse = this.listaCommesse.filter(c => 
      c.seriale.toLowerCase().includes(term) || 
      c.descrizione?.toLowerCase().includes(term) ||
      c.indirizzo?.cliente?.nome.toLowerCase().includes(term)
    );
  }

  // Seleziona la commessa e chiude la modale interna
  selectCommessa(commessa: Commessa, modal: any) {
    this.selectedCommessaId = commessa.id;
    modal.dismiss();
  }

  // Helper per mostrare il testo nell'input (visto che non è più una select automatica)
  getCommessaLabel(): string {
    if (!this.selectedCommessaId) return '';
    const c = this.listaCommesse.find(x => x.id === this.selectedCommessaId);
    return c ? `${c.seriale} - ${c.descrizione || 'No desc.'}` : '';
  }
}
