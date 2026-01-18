import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { CommessaService } from '../../services/commessa.service';
import { AllegatoService } from '../../services/allegato.service'; // <--- NUOVO
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { Cliente, Indirizzo } from '../../interfaces/models';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  personAddOutline,
  locationOutline,
  documentsOutline,
  closeOutline,
  add,
  searchOutline,
  cloudUploadOutline, // <--- Icone nuove
  documentAttachOutline,
  closeCircle,
} from 'ionicons/icons';

@Component({
  selector: 'app-nuova-commessa-globale-modal',
  templateUrl: './nuova-commessa-globale-modal.component.html',
  styleUrls: ['./nuova-commessa-globale-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, GenericSelectorComponent],
})
export class NuovaCommessaGlobaleModalComponent implements OnInit {
  // LISTE PER SELECT
  listaClienti: Cliente[] = [];
  listaCantieri: Indirizzo[] = [];

  modeCantiere: 'esistente' | 'nuovo' = 'esistente';
  modeCliente: 'esistente' | 'nuovo' = 'esistente';

  // DATI FORM COMMESSA
  commessa = {
    seriale: '',
    descrizione: '',
    stato: 'APERTA',
    valore_totale: null,
  };

  selectedCantiereId: number | null = null;
  selectedClienteId: number | null = null;
  selectedFile: File | null = null; // <--- FILE SELEZIONATO

  nuovoCantiere = {
    via: '',
    civico: '',
    citta: '',
    cap: '',
    provincia: '',
    stato: 'Italia',
  };

  nuovoCliente = {
    nome: '',
    email: '',
    telefono: '',
  };

  constructor(
    private modalCtrl: ModalController,
    private clienteService: ClienteService,
    private indirizzoService: IndirizzoService,
    private commessaService: CommessaService,
    private allegatoService: AllegatoService, // <--- INJECT
    private toastCtrl: ToastController,
  ) {
    addIcons({
      businessOutline,
      personAddOutline,
      locationOutline,
      documentsOutline,
      closeOutline,
      add,
      searchOutline,
      cloudUploadOutline,
      documentAttachOutline,
      closeCircle,
    });
  }

  ngOnInit() {
    this.caricaDati();
  }

  caricaDati() {
    this.clienteService.getAll().subscribe((data) => {
      this.listaClienti = data.sort((a, b) => a.nome.localeCompare(b.nome));
    });
    this.indirizzoService.getAll().subscribe((data) => {
      this.listaCantieri = data.sort((a, b) => a.citta.localeCompare(b.citta));
    });
  }

  chiudi() {
    this.modalCtrl.dismiss();
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

  // --- GESTIONE FILE ---
  triggerFileInput() {
    document.getElementById('fileInputGlobal')?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  rimuoviFile(ev: Event) {
    ev.stopPropagation();
    this.selectedFile = null;
    const input = document.getElementById(
      'fileInputGlobal',
    ) as HTMLInputElement;
    if (input) input.value = '';
  }

  // --- LOGICA DI SALVATAGGIO A CASCATA ---
  async salva() {
    try {
      let indirizzoIdFinale: number;

      // STEP 1: OTTIENI ID INDIRIZZO
      if (this.modeCantiere === 'esistente') {
        if (!this.selectedCantiereId) return;
        indirizzoIdFinale = this.selectedCantiereId;
      } else {
        let clienteIdFinale: number;
        // STEP 1.1: OTTIENI ID CLIENTE
        if (this.modeCliente === 'esistente') {
          if (!this.selectedClienteId) return;
          clienteIdFinale = this.selectedClienteId;
        } else {
          const clienteCreato = await this.createClientePromise();
          clienteIdFinale = clienteCreato.id;
        }
        // STEP 1.2: CREA CANTIERE
        const cantiereCreato =
          await this.createIndirizzoPromise(clienteIdFinale);
        indirizzoIdFinale = cantiereCreato.id;
      }

      // STEP 2: CREA COMMESSA (e ALLEGATO se presente)
      this.creaCommessa(indirizzoIdFinale);
    } catch (error) {
      console.error('Errore durante il salvataggio a cascata', error);
      this.showToast('Errore durante il processo di salvataggio.', 'danger');
    }
  }

  createClientePromise(): Promise<Cliente> {
    return new Promise((resolve, reject) => {
      this.clienteService.create(this.nuovoCliente).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(err),
      });
    });
  }

  createIndirizzoPromise(clienteId: number): Promise<Indirizzo> {
    const payload = {
      ...this.nuovoCantiere,
      cliente: { id: clienteId },
    } as any;
    return new Promise((resolve, reject) => {
      this.indirizzoService.create(payload).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(err),
      });
    });
  }

  creaCommessa(indirizzoId: number) {
    const payload = { ...this.commessa, indirizzo: { id: indirizzoId } } as any;

    this.commessaService.create(payload).subscribe({
      next: async (res) => {
        // --- UPLOAD ALLEGATO SE PRESENTE ---
        if (this.selectedFile) {
          try {
            await this.uploadFilePromise(res.id, this.selectedFile);
          } catch (err) {
            console.error('Errore upload allegato', err);
            this.showToast('Commessa creata, ma allegato fallito.', 'warning');
          }
        }
        this.modalCtrl.dismiss({ creato: true, data: res });
      },
      error: (err) => {
        console.error(err);
        this.showToast('Errore creazione commessa.', 'danger');
      },
    });
  }

  uploadFilePromise(commessaId: number, file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      this.allegatoService.upload(commessaId, file).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(err),
      });
    });
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      color,
      duration: 3000,
    });
    toast.present();
  }

  isValid(): boolean {
    const baseCommessaValid = this.commessa.seriale && this.commessa.stato;
    if (!baseCommessaValid) return false;

    if (this.modeCantiere === 'esistente') {
      return !!this.selectedCantiereId;
    } else {
      const addrValid = this.nuovoCantiere.via && this.nuovoCantiere.citta;
      if (this.modeCliente === 'esistente') {
        return !!(addrValid && this.selectedClienteId);
      } else {
        return !!(addrValid && this.nuovoCliente.nome);
      }
    }
  }
}
