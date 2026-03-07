import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonIcon,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommessaService } from '../../services/commessa.service';
import { GestioneAllegatiComponent } from '../gestione-allegati/gestione-allegati.component';
import { Commessa } from '../../interfaces/models';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentAttachOutline,
  closeCircle,
} from 'ionicons/icons';

@Component({
  selector: 'app-nuova-commessa-modal',
  templateUrl: './nuova-commessa-modal.component.html',
  styleUrls: ['./nuova-commessa-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonIcon,
    CommonModule,
    FormsModule,
    GestioneAllegatiComponent,
  ],
})
export class NuovaCommessaModalComponent implements OnInit {
  @Input() indirizzoId!: number;
  @Input() commessaEsistente?: Commessa;

  commessa: Partial<Commessa> = {
    seriale: '',
    descrizione: '',
    stato: 'APERTA',
    valore_totale: 0,
  };

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  constructor(
    private modalCtrl: ModalController,
    private commessaService: CommessaService,
    private toastCtrl: ToastController,
  ) {
    addIcons({ cloudUploadOutline, documentAttachOutline, closeCircle });
  }

  ngOnInit() {
    if (this.commessaEsistente) {
      this.commessa = { ...this.commessaEsistente };
    }
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  // --- SALVATAGGIO ---
  salva() {
    const payload = {
      ...this.commessa,
      indirizzo: { id: this.indirizzoId },
    };

    // 1. Crea o Aggiorna Commessa
    let obs$;
    if (this.commessaEsistente) {
      obs$ = this.commessaService.update(
        this.commessaEsistente.id,
        payload as any,
      );
    } else {
      obs$ = this.commessaService.create(payload as any);
    }

    obs$.subscribe({
      next: async (res) => {
        const idCommessa = this.commessaEsistente
          ? this.commessaEsistente.id
          : res.id;
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(idCommessa);
        }
        this.modalCtrl.dismiss({ aggiornato: true, data: res });
      },
      error: (err) => {
        console.error(err);
        this.showToast('Errore nel salvataggio commessa.', 'danger');
      },
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
}
