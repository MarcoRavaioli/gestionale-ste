import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { CommessaService } from '../../services/commessa.service';
import { AppuntamentoService } from '../../services/appuntamento.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import {
  Cliente,
  Indirizzo,
  Commessa,
  Appuntamento,
} from '../../interfaces/models';
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
  checkmarkCircle,
} from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-appuntamento-globale-modal',
  templateUrl: './nuovo-appuntamento-globale-modal.component.html',
  styleUrls: ['./nuovo-appuntamento-globale-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, GenericSelectorComponent],
})
export class NuovoAppuntamentoGlobaleModalComponent implements OnInit {
  // INPUT DAL PADRE
  @Input() dataIniziale?: string;
  @Input() appuntamento?: Appuntamento; // Questo è l'oggetto originale passato per la modifica
  @Input() commessaId?: number; // Contesto opzionale

  isEditing = false;

  // DATI DEL FORM (Separati dall'input per evitare conflitti)
  formDati = { nome: '', data_ora: '', descrizione: '' };

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

  // DATI FORM NUOVI OGGETTI
  nuovaCommessa = {
    seriale: '',
    descrizione: '',
    stato: 'APERTA',
    valore_totale: null,
  };
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
    this.caricaDatiListe();

    // --- LOGICA CRUCIALE: MODIFICA O CREAZIONE? ---
    if (this.appuntamento && this.appuntamento.id) {
      // *** CASO MODIFICA ***
      this.isEditing = true;

      // 1. Copia i dati semplici nel form
      this.formDati.nome = this.appuntamento.nome;
      this.formDati.descrizione = this.appuntamento.descrizione || '';

      // 2. FIX DATA: Taglia i secondi e il fuso orario 'Z' se presenti per far piacere all'input HTML
      if (this.appuntamento.data_ora) {
        this.formDati.data_ora = this.appuntamento.data_ora.substring(0, 16);
      }

      // 3. Pre-selezione Commessa (dal dato esistente)
      if (this.appuntamento.commessa) {
        this.selectedCommessaId = this.appuntamento.commessa.id;
        this.modeCommessa = 'esistente';
      }
    } else {
      // *** CASO CREAZIONE ***
      this.isEditing = false;

      // 1. Imposta data default (Oggi)
      if (this.dataIniziale) {
        this.formDati.data_ora = this.dataIniziale;
      } else {
        const now = new Date();
        now.setSeconds(0, 0);
        // Hack per timezone locale
        const localIso = new Date(
          now.getTime() - now.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);
        this.formDati.data_ora = localIso;
      }

      // 2. Pre-selezione Commessa (dal contesto)
      if (this.commessaId) {
        this.selectedCommessaId = this.commessaId;
      }
    }
  }

  caricaDatiListe() {
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
    this.comService.getAll().subscribe((d) => {
      this.listaCommesse = d.sort((a, b) => a.seriale.localeCompare(b.seriale));
      this.filteredCommesse = [...this.listaCommesse];
    });
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  // ... (Toggles e Helper rimangono uguali) ...
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

  isValid(): boolean {
    if (!this.formDati.nome || !this.formDati.data_ora) return false;
    if (this.modeCommessa === 'esistente' && !this.selectedCommessaId)
      return false;
    return true;
  }

  async salva() {
    try {
      let commessaIdFinale: number;

      // 1. GESTIONE COMMESSA (Logica esistente)
      if (this.modeCommessa === 'esistente') {
        if (!this.selectedCommessaId) return;
        commessaIdFinale = this.selectedCommessaId;
      } else {
        // ... (Logica creazione a cascata invariata) ...
        let indirizzoIdFinale: number;
        if (this.modeCantiere === 'esistente') {
          if (!this.selectedCantiereId) return;
          indirizzoIdFinale = this.selectedCantiereId;
        } else {
          let clienteIdFinale: number;
          if (this.modeCliente === 'esistente') {
            if (!this.selectedClienteId) return;
            clienteIdFinale = this.selectedClienteId;
          } else {
            const cli = await this.wrap(
              this.cliService.create(this.nuovoCliente)
            );
            clienteIdFinale = cli.id;
          }
          const indPayload = {
            ...this.nuovoCantiere,
            cliente: { id: clienteIdFinale },
          } as any;
          const ind = await this.wrap(this.indService.create(indPayload));
          indirizzoIdFinale = ind.id;
        }
        const comPayload = {
          ...this.nuovaCommessa,
          indirizzo: { id: indirizzoIdFinale },
        } as any;
        const com = await this.wrap(this.comService.create(comPayload));
        commessaIdFinale = com.id;
      }

      // 4. CREA O AGGIORNA APPUNTAMENTO
      const appPayload = {
        ...this.formDati, // Usa i dati del form
        commessa: { id: commessaIdFinale },
      } as any;

      if (this.isEditing && this.appuntamento) {
        // UPDATE
        this.appService.update(this.appuntamento.id, appPayload).subscribe({
          next: (res) => this.modalCtrl.dismiss({ creato: true, data: res }),
          error: (err) => console.error('Errore update', err),
        });
      } else {
        // CREATE
        this.appService.create(appPayload).subscribe({
          next: (res) => this.modalCtrl.dismiss({ creato: true, data: res }),
          error: (err) => console.error('Errore create', err),
        });
      }
    } catch (err) {
      console.error('Errore cascata', err);
    }
  }

  wrap(obs: any): Promise<any> {
    return new Promise((resolve, reject) => {
      obs.subscribe({
        next: (res: any) => resolve(res),
        error: (err: any) => reject(err),
      });
    });
  }
}
