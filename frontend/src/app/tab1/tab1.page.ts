import { Component, OnInit, signal, effect, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonIcon,
  IonRippleEffect,
  IonButtons,
  ModalController,
  ToastController,
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
import { ProfiloModalComponent } from '../components/profilo-modal/profilo-modal.component';
import { ImpostazioniModalComponent } from '../components/impostazioni-modal/impostazioni-modal.component';

import { GestioneUtentiModalComponent } from '../components/gestione-utenti-modal/gestione-utenti-modal.component';

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
  people,
  peopleOutline,
  walletOutline,
  personCircleOutline,
  time,
  briefcaseOutline,
  location,
  helpCircleOutline,
  settingsOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
    IonRippleEffect,
    IonButtons,
    CommonModule,
  ],
})
export class Tab1Page implements OnInit {
  userNome = signal<string>('Utente');
  isAdmin = signal<boolean>(false);
  isManager = signal<boolean>(false);

  appuntamentiOggi = signal<Appuntamento[]>([]);
  appuntamentiSettimana = signal<Appuntamento[]>([]);

  // Fatture Signals
  fattureInScadenza = signal<Fattura[]>([]);
  fattureScadute = signal<Fattura[]>([]);
  mostraFatture = signal<boolean>(false);

  // Team Signals
  mostraTeam = signal<boolean>(false);
  teamStats = signal<any[]>([]);
  totaleCostoTeam = signal<number>(0);
  private destroyRef = inject(DestroyRef);

  constructor(
    private appuntamentoService: AppuntamentoService,
    private fatturaService: FatturaService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private router: Router,
    private http: HttpClient,
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
      people,
      peopleOutline,
      walletOutline,
      personCircleOutline,
      time,
      briefcaseOutline,
      location,
      helpCircleOutline,
      settingsOutline,
    });
  }

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) {
          this.userNome.set(user.nome || user.nickname || 'Utente');
          this.isAdmin.set(this.authService.isAdmin());
          this.isManager.set(this.authService.hasManagerAccess());
        } else {
          this.userNome.set('Utente');
          this.isAdmin.set(false);
          this.isManager.set(false);
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
    if (this.isManager()) {
      this.caricaFatture();
      this.caricaTeamData();
    }
    if (event) setTimeout(() => event.target.complete(), 800);
  }

  toggleTeamPrivacy() {
    this.mostraTeam.update((m) => !m);
  }

  caricaTeamData() {
    const now = new Date();
    const anno = now.getFullYear();
    const mese = now.getMonth() + 1;

    const savedPasto = parseFloat(localStorage.getItem('costoPasto') || '5.29');
    const savedRates = JSON.parse(
      localStorage.getItem('tariffeCollaboratori') || '{}',
    );

    this.http
      .get<
        any[]
      >(`${environment.apiUrl}/tracciamento/report?anno=${anno}&mese=${mese}`)
      .subscribe((data) => {
        const stats = data.map((col) => {
          const tariffa = savedRates[col.id] || 10;
          const costo = col.totaleOre * tariffa + col.totaleBuoni * savedPasto;
          return { ...col, costoTotale: costo };
        });

        stats.sort((a, b) => b.costoTotale - a.costoTotale);
        this.teamStats.set(stats);
        this.totaleCostoTeam.set(
          stats.reduce((acc, curr) => acc + curr.costoTotale, 0),
        );
      });
  }

  togglePrivacy() {
    this.mostraFatture.update((m) => !m);
  }

  caricaFatture() {
    this.fatturaService.getAll().subscribe((data) => {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const traUnMese = new Date(oggi);
      traUnMese.setDate(oggi.getDate() + 30);

      this.fattureInScadenza.set(
        data.filter((f) => {
          if (!f.data_scadenza || f.incassata) return false;
          const scadenza = new Date(f.data_scadenza);
          return scadenza >= oggi && scadenza <= traUnMese;
        }),
      );

      this.fattureScadute.set(
        data.filter((f) => {
          if (!f.data_scadenza || f.incassata) return false;
          const scadenza = new Date(f.data_scadenza);
          return scadenza < oggi;
        }),
      );
    });
  }

  async apriDettaglioFattura(fattura: Fattura) {
    const modal = await this.modalCtrl.create({
      component: FatturaDettaglioModalComponent,
      componentProps: { fattura },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.eliminato || data?.aggiornato) this.caricaDati();
  }

  caricaAppuntamenti() {
    this.appuntamentoService.getAll().subscribe((data) => {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const traSetteGiorni = new Date(oggi);
      traSetteGiorni.setDate(oggi.getDate() + 7);

      this.appuntamentiOggi.set(
        data
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
              new Date(a.data_ora).getTime() - new Date(b.data_ora).getTime(),
          ),
      );

      this.appuntamentiSettimana.set(
        data
          .filter((app) => {
            const dataApp = new Date(app.data_ora);
            dataApp.setHours(0, 0, 0, 0);
            return dataApp > oggi && dataApp <= traSetteGiorni;
          })
          .sort(
            (a, b) =>
              new Date(a.data_ora).getTime() - new Date(b.data_ora).getTime(),
          ),
      );
    });
  }

  goToAppuntamento(app: Appuntamento) {
    this.router.navigate(['/appuntamento-dettaglio', app.id]);
  }

  async openProfilo() {
    const modal = await this.modalCtrl.create({
      component: ProfiloModalComponent,
    });
    await modal.present();
  }

  async openImpostazioni() {
    const modal = await this.modalCtrl.create({
      component: ImpostazioniModalComponent,
    });
    await modal.present();
    // Refresh user state after dismissal in case they updated profile or logged out
    const { data } = await modal.onWillDismiss();
    this.caricaDati();
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
    const { data } = await modal.onWillDismiss();
    if (data?.creato) this.caricaDati();
  }

  async openGestioneUtenti() {
    const modal = await this.modalCtrl.create({
      component: GestioneUtentiModalComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.aggiornato || data?.eliminato) this.caricaDati();
  }
}
