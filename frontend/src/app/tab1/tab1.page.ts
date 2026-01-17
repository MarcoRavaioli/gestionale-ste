import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Services
import { AppuntamentoService } from '../services/appuntamento.service';
import { FatturaService } from '../services/fattura.service';
import { Appuntamento, Fattura } from '../interfaces/models';

// Modals
import { NuovaFatturaModalComponent } from '../components/nuova-fattura-modal/nuova-fattura-modal.component';
import { NuovoAppuntamentoGlobaleModalComponent } from '../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';
import { NuovaCommessaModalComponent } from '../components/nuova-commessa-modal/nuova-commessa-modal.component';
import { NuovoIndirizzoModalComponent } from '../components/nuovo-indirizzo-modal/nuovo-indirizzo-modal.component';
// IMPORTANTE: Importiamo il dettaglio fattura per aprirlo
import { FatturaDettaglioModalComponent } from '../components/fattura-dettaglio-modal/fattura-dettaglio-modal.component';

import { addIcons } from 'ionicons';
import {
  calendar,
  timeOutline,
  personOutline,
  locationOutline,
  briefcase,
  construct,
  receipt,
  statsChart,
  alertCircle,
  hourglassOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  arrowUpCircle,
  arrowDownCircle, // <--- ICONE PER ENTRATA/USCITA
} from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class Tab1Page implements OnInit {
  userNome = 'Marco';

  appuntamentiOggi: Appuntamento[] = [];
  appuntamentiSettimana: Appuntamento[] = [];
  fattureInScadenza: Fattura[] = [];
  fattureScadute: Fattura[] = [];

  mostraFatture = false;

  constructor(
    private appuntamentoService: AppuntamentoService,
    private fatturaService: FatturaService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({
      calendar,
      timeOutline,
      personOutline,
      locationOutline,
      briefcase,
      construct,
      receipt,
      statsChart,
      alertCircle,
      hourglassOutline,
      eyeOutline,
      eyeOffOutline,
      lockClosedOutline,
      arrowUpCircle,
      arrowDownCircle,
    });
  }

  ngOnInit() {
    this.caricaDati();
  }

  ionViewWillEnter() {
    this.caricaDati();
  }

  caricaDati(event?: any) {
    this.caricaAppuntamenti();
    this.caricaFatture();
    if (event) setTimeout(() => event.target.complete(), 800);
  }

  togglePrivacy() {
    this.mostraFatture = !this.mostraFatture;
  }

  caricaAppuntamenti() {
    // ... (Logica esistente invariata) ...
    this.appuntamentoService.getAll().subscribe((data) => {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const traSetteGiorni = new Date(oggi);
      traSetteGiorni.setDate(oggi.getDate() + 7);

      this.appuntamentiOggi = data
        .filter((app) => {
          const dataApp = new Date(app.data_ora);
          return (
            dataApp.getDate() === oggi.getDate() &&
            dataApp.getMonth() === oggi.getMonth() &&
            dataApp.getFullYear() === oggi.getFullYear()
          );
        })
        .sort(
          (a, b) =>
            new Date(a.data_ora).getTime() - new Date(b.data_ora).getTime()
        );

      this.appuntamentiSettimana = data
        .filter((app) => {
          const dataApp = new Date(app.data_ora);
          dataApp.setHours(0, 0, 0, 0);
          return dataApp > oggi && dataApp <= traSetteGiorni;
        })
        .sort(
          (a, b) =>
            new Date(a.data_ora).getTime() - new Date(b.data_ora).getTime()
        );
    });
  }

  caricaFatture() {
    this.fatturaService.getAll().subscribe((data) => {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const traUnMese = new Date(oggi);
      traUnMese.setDate(oggi.getDate() + 30);

      this.fattureInScadenza = data.filter((f) => {
        if (!f.data_scadenza || f.incassata) return false;
        const scadenza = new Date(f.data_scadenza);
        return scadenza >= oggi && scadenza <= traUnMese;
      });

      this.fattureScadute = data.filter((f) => {
        if (!f.data_scadenza || f.incassata) return false;
        const scadenza = new Date(f.data_scadenza);
        return scadenza < oggi;
      });
    });
  }

  // --- APERTURA MODALI ---

  async apriDettaglioFattura(fattura: Fattura) {
    const modal = await this.modalCtrl.create({
      component: FatturaDettaglioModalComponent,
      componentProps: { fattura: fattura },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    // Ricarichiamo se è cambiato qualcosa (es. pagata o eliminata)
    if (data?.eliminato || data?.aggiornato) this.caricaDati();
  }

  goToAppuntamento(app: Appuntamento) {
    if (app.commessa?.indirizzo?.cliente?.id) {
      this.router.navigate(
        ['/cliente-dettaglio', app.commessa.indirizzo.cliente.id],
        {
          queryParams: {
            cantiereId: app.commessa.indirizzo.id,
            commessaId: app.commessa.id,
            appuntamentoId: app.id,
          },
        }
      );
    } else {
      this.toastCtrl
        .create({
          message:
            'Impossibile aprire: Appuntamento non collegato a un cliente.',
          duration: 2000,
          color: 'warning',
        })
        .then((t) => t.present());
    }
  }

  async openModal(tipo: 'appuntamento' | 'commessa' | 'cantiere' | 'fattura') {
    let component: any;
    switch (tipo) {
      case 'appuntamento':
        component = NuovoAppuntamentoGlobaleModalComponent;
        break;
      case 'fattura':
        component = NuovaFatturaModalComponent;
        break;
      case 'commessa':
        component = NuovaCommessaModalComponent;
        break;
      case 'cantiere':
        component = NuovoIndirizzoModalComponent;
        break;
    }

    if (component) {
      const modal = await this.modalCtrl.create({ component });
      await modal.present();
      const { data } = await modal.onWillDismiss();
      if (data?.creato) this.caricaDati();
    } else {
      const toast = await this.toastCtrl.create({
        message: 'Componente non trovato.',
        duration: 2000,
        color: 'warning',
      });
      toast.present();
    }
  }

  goToCharts() {
    this.toastCtrl
      .create({
        message: 'Statistiche in arrivo...',
        duration: 2000,
        color: 'primary',
      })
      .then((t) => t.present());
  }
}
