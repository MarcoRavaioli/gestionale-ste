import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonIcon, IonInput, IonTextarea, IonItem,
  ModalController, ToastController, AlertController, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { AppuntamentoService } from '../../services/appuntamento.service';
import { CommessaService } from '../../services/commessa.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { ClienteService } from '../../services/cliente.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { Appuntamento, Commessa, Indirizzo, Cliente } from '../../interfaces/models';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

import { addIcons } from 'ionicons';
import { calendarOutline, documentsOutline, closeOutline, add, trashOutline, locationOutline, personOutline, linkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-appuntamento-globale-modal',
  templateUrl: './nuovo-appuntamento-globale-modal.component.html',
  styleUrls: ['./nuovo-appuntamento-globale-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonIcon, IonInput, IonTextarea, IonItem,
    CommonModule, FormsModule, GenericSelectorComponent,
    IonSegment, IonSegmentButton
  ],
})
export class NuovoAppuntamentoGlobaleModalComponent implements OnInit {
  @Input() appuntamento?: Appuntamento;
  isEditing = false;

  // SCELTA MULTIPLA (Le 4 opzioni di collegamento)
  tipoCollegamento: 'commessa' | 'cantiere' | 'cliente' | 'nessuno' = 'commessa';

  listaCommesse: Commessa[] = [];
  selectedCommessaId: number | null = null;
  
  listaCantieri: Indirizzo[] = [];
  selectedCantiereId: number | null = null;

  listaClienti: Cliente[] = [];
  selectedClienteId: number | null = null;

  formDati = {
    nome: '',
    data_ora: '',
    descrizione: '',
  };

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private appService: AppuntamentoService,
    private comService: CommessaService,
    private indService: IndirizzoService,
    private clienteService: ClienteService
  ) {
    addIcons({ calendarOutline, documentsOutline, closeOutline, add, trashOutline, locationOutline, personOutline, linkOutline });
  }

  ngOnInit() {
    this.caricaDatiBase();
    if (this.appuntamento) {
      this.isEditing = true;
      this.formDati = {
        nome: this.appuntamento.nome,
        data_ora: this.appuntamento.data_ora ? new Date(this.appuntamento.data_ora).toISOString().slice(0, 16) : '',
        descrizione: this.appuntamento.descrizione || '',
      };
      
      // Ripristina la selezione corretta in base ai dati esistenti
      if (this.appuntamento.commessa) {
        this.tipoCollegamento = 'commessa';
        this.selectedCommessaId = this.appuntamento.commessa.id;
      } else if (this.appuntamento.indirizzo) {
        this.tipoCollegamento = 'cantiere';
        this.selectedCantiereId = this.appuntamento.indirizzo.id;
      } else if (this.appuntamento.cliente) {
        this.tipoCollegamento = 'cliente';
        this.selectedClienteId = this.appuntamento.cliente.id;
      } else {
        this.tipoCollegamento = 'nessuno';
      }
    }
  }

  caricaDatiBase() {
    this.comService.getAll().subscribe((res) => (this.listaCommesse = res));
    this.indService.getAll().subscribe((res) => (this.listaCantieri = res));
    this.clienteService.getAll().subscribe((res) => (this.listaClienti = res));
  }

  chiudi() { this.modalCtrl.dismiss(); }

  isValid(): boolean {
    if (!this.formDati.data_ora) return false;
    if (this.tipoCollegamento === 'commessa' && !this.selectedCommessaId) return false;
    if (this.tipoCollegamento === 'cantiere' && !this.selectedCantiereId) return false;
    if (this.tipoCollegamento === 'cliente' && !this.selectedClienteId) return false;
    return true;
  }

  salva() {
    const payload: any = { ...this.formDati };
    if (!payload.nome || payload.nome.trim() === '') payload.nome = 'Intervento';

    // Reset di tutti i legami
    payload.commessa = null;
    payload.indirizzo = null;
    payload.cliente = null;

    // Assegnazione in base alla scelta (uno esclude l'altro a livello diretto)
    if (this.tipoCollegamento === 'commessa' && this.selectedCommessaId) {
      payload.commessa = { id: this.selectedCommessaId };
    } else if (this.tipoCollegamento === 'cantiere' && this.selectedCantiereId) {
      payload.indirizzo = { id: this.selectedCantiereId };
    } else if (this.tipoCollegamento === 'cliente' && this.selectedClienteId) {
      payload.cliente = { id: this.selectedClienteId };
    }

    if (Haptics) Haptics.impact({ style: ImpactStyle.Light });

    if (this.isEditing && this.appuntamento) {
      this.appService.update(this.appuntamento.id, payload).subscribe({
        next: (res) => this.modalCtrl.dismiss({ creato: true, data: res }),
        error: () => this.mostraToast('Errore aggiornamento', 'danger')
      });
    } else {
      this.appService.create(payload).subscribe({
        next: (res) => this.modalCtrl.dismiss({ creato: true, data: res }),
        error: () => this.mostraToast('Errore creazione', 'danger')
      });
    }
  }

  async elimina() {
    if (Haptics) Haptics.impact({ style: ImpactStyle.Medium });
    const alert = await this.alertCtrl.create({
      header: 'Elimina Appuntamento',
      message: 'Sei sicuro di voler eliminare questo appuntamento?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.confermaEliminazione() }
      ]
    });
    await alert.present();
  }

  confermaEliminazione() {
    if (!this.appuntamento) return;
    this.appService.delete(this.appuntamento.id).subscribe({
      next: async () => {
        if (Haptics) await Haptics.notification({ type: 'SUCCESS' } as any);
        this.mostraToast('Appuntamento eliminato', 'success');
        this.modalCtrl.dismiss({ eliminato: true }); 
      },
      error: async () => this.mostraToast('Errore', 'danger')
    });
  }

  async mostraToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, color, duration: 2000 });
    toast.present();
  }
}