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
  IonButton, // <--- AGGIUNTO IonButton
} from '@ionic/angular/standalone';

import { IndirizzoService } from 'src/app/services/indirizzo.service';
import { CommessaService } from 'src/app/services/commessa.service';
import { AuthService } from 'src/app/services/auth.service';
import { Indirizzo, Commessa } from 'src/app/interfaces/models';

import { IndirizzoAccordionComponent } from '../../components/indirizzo-accordion/indirizzo-accordion.component';
import { NuovaCommessaModalComponent } from '../../components/nuova-commessa-modal/nuova-commessa-modal.component';
import { NuovoIndirizzoModalComponent } from '../../components/nuovo-indirizzo-modal/nuovo-indirizzo-modal.component';

import { addIcons } from 'ionicons';
import {
  businessOutline,
  location,
  pencilOutline,
  trashOutline,
} from 'ionicons/icons';
import { IonicSafeString } from '@ionic/angular';

@Component({
  selector: 'app-cantiere-dettaglio',
  templateUrl: './cantiere-dettaglio.page.html',
  styleUrls: ['./cantiere-dettaglio.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IndirizzoAccordionComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton, // <--- AGGIUNTO IonButton
  ],
})
export class CantiereDettaglioPage implements OnInit {
  indirizzo: Indirizzo | null = null;
  hasManagerAccess = false;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private indirizzoService: IndirizzoService,
    private commessaService: CommessaService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({ businessOutline, location, pencilOutline, trashOutline });
  }

  ngOnInit() {
    this.hasManagerAccess = this.authService.hasManagerAccess();
    const idParam = this.route.snapshot.paramMap.get('id');
    const cantiereId = parseInt(idParam || '', 10);

    if (isNaN(cantiereId) || !cantiereId) {
      this.navCtrl.navigateRoot('/tabs/tab3');
      return;
    }
    this.caricaDati(cantiereId);
  }

  caricaDati(id: number) {
    // FIX: Usiamo direttamente il metodo corretto findOne() che hai nel servizio!
    this.indirizzoService.findOne(id).subscribe({
      next: (res: Indirizzo) => {
        this.indirizzo = res;
      },
      error: (err) => {
        console.error('Errore caricamento cantiere', err);
        this.navCtrl.navigateRoot('/tabs/tab3');
      },
    });
  }

  async apriModalIndirizzo() {
    const m = await this.modalCtrl.create({
      component: NuovoIndirizzoModalComponent,
      componentProps: { indirizzoEsistente: this.indirizzo },
    });
    await m.present();
    const { data } = await m.onWillDismiss();
    if (data?.aggiornato && this.indirizzo) this.caricaDati(this.indirizzo.id);
  }

  async apriModalCommessa(indirizzoId: number | null, esistente?: Commessa) {
    const m = await this.modalCtrl.create({
      component: NuovaCommessaModalComponent,
      componentProps: { indirizzoId, commessaEsistente: esistente },
    });
    await m.present();
    const { data } = await m.onWillDismiss();
    if (data?.aggiornato || data?.creato) this.caricaDati(this.indirizzo!.id);
  }

  async eliminaCommessa(commessa: Commessa) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Commessa',
      message: `Vuoi eliminare ${commessa.seriale}?`,
      inputs: [
        {
          name: 'cascade',
          type: 'checkbox',
          label: 'Elimina anche tutte le entità figlie',
          value: 'cascade',
        },
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: (data) => {
            const cascade = data && data.includes('cascade');
            this.commessaService
              .delete(commessa.id, cascade)
              .subscribe(() => this.caricaDati(this.indirizzo!.id));
          },
        },
      ],
    });
    await alert.present();
  }
}
