import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonIcon, IonInput, IonTextarea, IonToggle, IonItem,
  ModalController, ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { AppuntamentoService } from '../../services/appuntamento.service';
import { CommessaService } from '../../services/commessa.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { Appuntamento, Commessa } from '../../interfaces/models';
// IMPORTIAMO IL MODALE DELLA COMMESSA CHE GIA' ESISTE!
import { NuovaCommessaGlobaleModalComponent } from '../nuova-commessa-globale-modal/nuova-commessa-globale-modal.component'; 

import { addIcons } from 'ionicons';
import { calendarOutline, documentsOutline, closeOutline, add } from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-appuntamento-globale-modal',
  templateUrl: './nuovo-appuntamento-globale-modal.component.html',
  styleUrls: ['./nuovo-appuntamento-globale-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonIcon, IonInput, IonTextarea, IonToggle, IonItem,
    CommonModule, FormsModule, GenericSelectorComponent,
  ],
})
export class NuovoAppuntamentoGlobaleModalComponent implements OnInit {
  @Input() appuntamento?: Appuntamento;
  isEditing = false;

  listaCommesse: Commessa[] = [];
  selectedCommessaId: number | null = null;
  
  // LA SOLUZIONE ALLA RICHIESTA DEL TUO CLIENTE:
  usaCommessaGenerica = false; 

  formDati = {
    nome: '',
    data_ora: '',
    descrizione: '',
  };

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private appService: AppuntamentoService,
    private comService: CommessaService,
    private alertCtrl: AlertController,
  ) {
    addIcons({ calendarOutline, documentsOutline, closeOutline, add });
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
      if (this.appuntamento.commessa) {
        this.selectedCommessaId = this.appuntamento.commessa.id;
      } else {
        this.usaCommessaGenerica = true;
      }
    }
  }

  caricaDatiBase() {
    this.comService.getAll().subscribe((res) => (this.listaCommesse = res));
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  // --- IL CUORE DEL REFACTORING: USIAMO IL MODALE GIA' FATTO! ---
  async creaNuovaCommessaAlVolo() {
    const modal = await this.modalCtrl.create({
      component: NuovaCommessaGlobaleModalComponent,
    });
    await modal.present();
    
    // Quando il modale si chiude, intercettiamo i dati
    const { data } = await modal.onWillDismiss();
    if (data && data.creato && data.data) {
      // Aggiungiamo la nuova commessa alla lista e la auto-selezioniamo!
      this.listaCommesse.unshift(data.data);
      this.selectedCommessaId = data.data.id;
    }
  }

  isValid(): boolean {
    if (!this.formDati.data_ora) return false;
    // Se è generica, la data basta. Se non è generica, serve aver selezionato una commessa.
    if (!this.usaCommessaGenerica && !this.selectedCommessaId) return false;
    return true;
  }

  salva() {
    const payload: any = { ...this.formDati };
    if (!payload.nome || payload.nome.trim() === '') payload.nome = 'Intervento';

    // Gestione intelligente della Commessa
    if (!this.usaCommessaGenerica && this.selectedCommessaId) {
      payload.commessa = { id: this.selectedCommessaId };
    } else {
      // Se il tuo backend crasha con null, cambia questa riga in: payload.commessa = { id: 1 }; (ID di una tua commessa fissa)
      payload.commessa = null; 
    }

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

  async mostraToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, color, duration: 2000 });
    toast.present();
  }

  async elimina() {
    // Feedback tattile di avviso
    const alert = await this.alertCtrl.create({
      header: 'Elimina Appuntamento',
      message: 'Sei sicuro di voler eliminare questo appuntamento? L\'azione è irreversibile.',
      buttons: [
        { 
          text: 'Annulla', 
          role: 'cancel' 
        },
        {
          text: 'Elimina',
          role: 'destructive', // Su iOS lo colora automaticamente di rosso
          handler: () => {
            this.confermaEliminazione();
          }
        }
      ]
    });
    await alert.present();
  }

  confermaEliminazione() {
    if (!this.appuntamento) return;

    this.appService.delete(this.appuntamento.id).subscribe({
      next: async () => {
        this.mostraToast('Appuntamento eliminato con successo', 'success');
        // Chiudiamo il modale passando un flag per dire alla pagina di ricaricare i dati
        this.modalCtrl.dismiss({ eliminato: true }); 
      },
      error: async (err) => {
        console.error(err);
        this.mostraToast('Errore durante l\'eliminazione', 'danger');
      }
    });
  }
}