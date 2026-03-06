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
} from '@ionic/angular/standalone';

import { AppuntamentoService } from 'src/app/services/appuntamento.service';
import { AuthService } from 'src/app/services/auth.service';
import { Appuntamento } from 'src/app/interfaces/models';
import { NuovoAppuntamentoGlobaleModalComponent } from '../../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';

import { addIcons } from 'ionicons';
import {
  calendar,
  pencilOutline,
  trashOutline,
  personOutline,
  locationOutline,
  timeOutline,
  documentTextOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-appuntamento-dettaglio',
  templateUrl: './appuntamento-dettaglio.page.html',
  styleUrls: ['./appuntamento-dettaglio.page.scss'],
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
  ],
})
export class AppuntamentoDettaglioPage implements OnInit {
  appuntamento: Appuntamento | null = null;
  hasManagerAccess = false;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private appService: AppuntamentoService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({
      calendar,
      pencilOutline,
      trashOutline,
      personOutline,
      locationOutline,
      timeOutline,
      documentTextOutline,
    });
  }

  ngOnInit() {
    this.hasManagerAccess = this.authService.hasManagerAccess();
    const idParam = this.route.snapshot.paramMap.get('id');
    const appId = parseInt(idParam || '', 10);

    if (isNaN(appId) || !appId) {
      this.navCtrl.navigateRoot('/tabs/tab3');
      return;
    }
    this.caricaDati(appId);
  }

  caricaDati(id: number) {
    this.appService.getOne(id).subscribe({
      next: (res: Appuntamento) => {
        this.appuntamento = res;
      },
      error: (err) => {
        console.error('Errore caricamento appuntamento', err);
        this.navCtrl.navigateRoot('/tabs/tab3');
      },
    });
  }

  async apriModalAppuntamento() {
    const m = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
      componentProps: {
        appuntamento: this.appuntamento,
        clienteId: this.appuntamento?.cliente?.id,
        indirizzoId: this.appuntamento?.indirizzo?.id,
        commessaId: this.appuntamento?.commessa?.id,
      },
    });
    await m.present();
    const { data } = await m.onWillDismiss();
    if (data?.aggiornato && this.appuntamento)
      this.caricaDati(this.appuntamento.id);
  }
}
