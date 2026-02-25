import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // <--- IMPORT HTTP
import { environment } from 'src/environments/environment'; // <--- IMPORT ENV
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, 
  IonRefresherContent, IonButton, IonIcon, IonRippleEffect,
  ModalController, ToastController 
} from '@ionic/angular/standalone';

// Services
import { AppuntamentoService } from '../services/appuntamento.service';
import { FatturaService } from '../services/fattura.service';
import { AuthService } from '../services/auth.service';
import { Appuntamento, Fattura } from '../interfaces/models';

// Modals
import { NuovaFatturaModalComponent } from '../components/nuova-fattura-modal/nuova-fattura-modal.component';
import { NuovoAppuntamentoGlobaleModalComponent } from '../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';
import { NuovaCommessaModalComponent } from '../components/nuova-commessa-modal/nuova-commessa-modal.component';
import { NuovoIndirizzoModalComponent } from '../components/nuovo-indirizzo-modal/nuovo-indirizzo-modal.component';
import { FatturaDettaglioModalComponent } from '../components/fattura-dettaglio-modal/fattura-dettaglio-modal.component';
import { NuovoCollaboratoreModalComponent } from '../components/nuovo-collaboratore-modal/nuovo-collaboratore-modal.component';

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
  arrowDownCircle,
  logOutOutline,
  personAdd,
  peopleOutline, // <--- NUOVA
  walletOutline, // <--- NUOVA
  personCircleOutline,
  time,
  briefcaseOutline,
  location,
} from 'ionicons/icons';
import { ProfiloModalComponent } from '../components/profilo-modal/profilo-modal.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonButton, IonIcon, IonRippleEffect, CommonModule],
})
export class Tab1Page implements OnInit {
  userNome = 'Utente';
  isAdmin = false;
  isManager = false;

  appuntamentiOggi: Appuntamento[] = [];
  appuntamentiSettimana: Appuntamento[] = [];

  // FATTURE
  fattureInScadenza: Fattura[] = [];
  fattureScadute: Fattura[] = [];
  mostraFatture = false;

  // TEAM (Nuovo)
  mostraTeam = false;
  teamStats: any[] = [];
  totaleCostoTeam = 0;

  constructor(
    private appuntamentoService: AppuntamentoService,
    private fatturaService: FatturaService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private router: Router,
    private http: HttpClient // <--- INIEZIONE HTTP
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
      logOutOutline,
      personAdd,
      peopleOutline,
      walletOutline,
      personCircleOutline,
      time,
      briefcaseOutline,
      location,
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userNome = user.nome || user.nickname;
        this.isAdmin = this.authService.isAdmin();
        this.isManager = this.authService.hasManagerAccess();
      } else {
        this.userNome = 'Utente';
        this.isAdmin = false;
        this.isManager = false;
      }
      this.caricaDati();
    });
  }

  ionViewWillEnter() {
    this.caricaDati();
  }

  logout() {
    this.authService.logout();
  }

  caricaDati(event?: any) {
    this.caricaAppuntamenti();
    if (this.isManager) {
      this.caricaFatture();
      this.caricaTeamData(); // <--- CARICA DATI TEAM
    }
    if (event) setTimeout(() => event.target.complete(), 800);
  }

  // --- LOGICA TEAM ---
  toggleTeamPrivacy() {
    this.mostraTeam = !this.mostraTeam;
  }

  caricaTeamData() {
    const now = new Date();
    const anno = now.getFullYear();
    const mese = now.getMonth() + 1;

    // Recupera le impostazioni salvate nella Tab 5 (localStorage)
    const savedPasto = parseFloat(localStorage.getItem('costoPasto') || '5.29');
    const savedRates = JSON.parse(
      localStorage.getItem('tariffeCollaboratori') || '{}'
    );

    this.http
      .get<any[]>(
        `${environment.apiUrl}/tracciamento/report?anno=${anno}&mese=${mese}`
      )
      .subscribe((data) => {
        this.teamStats = data.map((col) => {
          const tariffa = savedRates[col.id] || 10; // Default 10€
          const costo = col.totaleOre * tariffa + col.totaleBuoni * savedPasto;
          return {
            ...col,
            costoTotale: costo,
          };
        });

        // Ordina dal più costoso
        this.teamStats.sort((a, b) => b.costoTotale - a.costoTotale);
        this.totaleCostoTeam = this.teamStats.reduce(
          (acc, curr) => acc + curr.costoTotale,
          0
        );
      });
  }

  // --- LOGICA FATTURE ---
  togglePrivacy() {
    this.mostraFatture = !this.mostraFatture;
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

  async apriDettaglioFattura(fattura: Fattura) {
    const modal = await this.modalCtrl.create({
      component: FatturaDettaglioModalComponent,
      componentProps: { fattura: fattura },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.eliminato || data?.aggiornato) this.caricaDati();
  }

  // --- LOGICA APPUNTAMENTI ---
  caricaAppuntamenti() {
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

  async openProfilo() {
    const modal = await this.modalCtrl.create({
      component: ProfiloModalComponent
    });
    await modal.present();
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

  async openNuovoCollaboratore() {
    const modal = await this.modalCtrl.create({
      component: NuovoCollaboratoreModalComponent,
    });
    await modal.present();
  }
  
}
