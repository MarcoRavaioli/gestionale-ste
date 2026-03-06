import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonIcon,
  ToastController,
  ModalController,
  AlertController,
  NavController,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonBadge,
} from '@ionic/angular/standalone';

import { CommessaService } from 'src/app/services/commessa.service';
import { AuthService } from 'src/app/services/auth.service';
import { Commessa } from 'src/app/interfaces/models';
import { NuovaCommessaModalComponent } from '../../components/nuova-commessa-modal/nuova-commessa-modal.component';

import { addIcons } from 'ionicons';
import {
  documents,
  pencilOutline,
  trashOutline,
  personOutline,
  locationOutline,
  barcodeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-commessa-dettaglio',
  templateUrl: './commessa-dettaglio.page.html',
  styleUrls: ['./commessa-dettaglio.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonBadge,
  ],
})
export class CommessaDettaglioPage implements OnInit {
  commessa: Commessa | null = null;
  hasManagerAccess = false;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private commessaService: CommessaService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({
      documents,
      pencilOutline,
      trashOutline,
      personOutline,
      locationOutline,
      barcodeOutline,
    });
  }

  ngOnInit() {
    this.hasManagerAccess = this.authService.hasManagerAccess();
    const idParam = this.route.snapshot.paramMap.get('id');
    const commessaId = parseInt(idParam || '', 10);

    if (isNaN(commessaId) || !commessaId) {
      this.navCtrl.navigateRoot('/tabs/tab3');
      return;
    }
    this.caricaDati(commessaId);
  }

  caricaDati(id: number) {
    this.commessaService.getOne(id).subscribe({
      next: (res: Commessa) => {
        this.commessa = res;
      },
      error: (err) => {
        console.error('Errore caricamento commessa', err);
        this.navCtrl.navigateRoot('/tabs/tab3');
      },
    });
  }

  async apriModalCommessa() {
    const m = await this.modalCtrl.create({
      component: NuovaCommessaModalComponent,
      componentProps: {
        commessaEsistente: this.commessa,
        indirizzoId: this.commessa?.indirizzo?.id,
      },
    });
    await m.present();
    const { data } = await m.onWillDismiss();
    if (data?.aggiornato && this.commessa) this.caricaDati(this.commessa.id);
  }

  getColoreStato(stato: string): string {
    switch (stato) {
      case 'APERTA':
        return 'success';
      case 'IN_CORSO':
        return 'warning';
      case 'CHIUSA':
        return 'medium';
      default:
        return 'primary';
    }
  }
}
