import { Component, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Componenti Liste
import { ListaClientiComponent } from '../components/lista-clienti/lista-clienti.component';
import { ListaCantieriComponent } from '../components/lista-cantieri/lista-cantieri.component';
import { ListaCommesseComponent } from '../components/lista-commesse/lista-commesse.component';
import { ListaAppuntamentiComponent } from '../components/lista-appuntamenti/lista-appuntamenti.component';
import { ListaDocumentiComponent } from '../components/lista-documenti/lista-documenti.component';

// Componenti Ionic
import {
  ModalController,
  PopoverController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonLabel,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonAvatar,
  IonFab,
  IonFabButton,
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';

// Servizi & Modelli
import { ClienteService } from '../services/cliente.service';
import { IndirizzoService } from '../services/indirizzo.service';
import { CommessaService } from '../services/commessa.service';
import { AppuntamentoService } from '../services/appuntamento.service';
import { PreferencesService, ViewSettings } from '../services/preferences';
import {
  Appuntamento,
  Cliente,
  Commessa,
  Indirizzo,
} from '../interfaces/models';

// Modali
import { NuovoClienteModalComponent } from '../components/nuovo-cliente-modal/nuovo-cliente-modal.component';
import { NuovoCantiereGlobaleModalComponent } from '../components/nuovo-cantiere-globale-modal/nuovo-cantiere-globale-modal.component';
import { NuovaCommessaGlobaleModalComponent } from '../components/nuova-commessa-globale-modal/nuova-commessa-globale-modal.component';
import { NuovoAppuntamentoGlobaleModalComponent } from '../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';
import { ListSettingsPopoverComponent } from '../components/list-settings-popover/list-settings-popover.component';

// Icone
import { addIcons } from 'ionicons';
import {
  add,
  searchOutline,
  locationOutline,
  personOutline,
  filterOutline,
  businessOutline,
  personAddOutline,
  callOutline,
  documentsOutline,
  calendarOutline,
  peopleOutline,
  chevronForward,
  location,
  documents,
  storefrontOutline,
  attachOutline,
  folderOpenOutline,
  calendarNumberOutline,
  createOutline,
} from 'ionicons/icons';

// RxJS
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

type VistaType =
  | 'clienti'
  | 'cantieri'
  | 'commesse'
  | 'appuntamenti'
  | 'documenti';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonLabel,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonItem,
    IonAvatar,
    IonFab,
    IonFabButton,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
    ListaClientiComponent,
    ListaCantieriComponent,
    ListaCommesseComponent,
    ListaAppuntamentiComponent,
    ListaDocumentiComponent,
  ],
})
export class Tab3Page implements OnInit {
  vistaCorrente = signal<VistaType>('clienti');
  ricerca = signal<string>('');
  isLoading = signal<boolean>(true);

  @ViewChild('listaDoc') listaDocComponent!: ListaDocumentiComponent;

  // View Settings
  settingsClienti = signal<ViewSettings>({
    orderBy: 'nome',
    orderDirection: 'asc',
  });
  settingsCantieri = signal<ViewSettings>({
    orderBy: 'citta',
    orderDirection: 'asc',
  });
  settingsCommesse = signal<ViewSettings>({
    orderBy: 'seriale',
    orderDirection: 'asc',
  });
  settingsAppuntamenti = signal<ViewSettings>({
    orderBy: 'data_ora',
    orderDirection: 'desc',
  });

  // Paginators
  clientiPage = signal(1);
  clientiTotalPages = signal(1);
  cantieriPage = signal(1);
  cantieriTotalPages = signal(1);
  commessePage = signal(1);
  commesseTotalPages = signal(1);
  appuntamentiPage = signal(1);
  appuntamentiTotalPages = signal(1);
  limit = 15;

  private searchSubject$ = new Subject<string>();

  // Dati derivati
  clientiVisualizzati = computed(() =>
    this.ordinaLista(
      [...this.clienteService.clientiState()],
      this.settingsClienti().orderBy,
      this.settingsClienti().orderDirection,
    ),
  );
  cantieriLista = computed(() =>
    this.ordinaLista(
      [...this.indirizzoService.cantieriState()],
      this.settingsCantieri().orderBy,
      this.settingsCantieri().orderDirection,
    ),
  );
  commesseLista = computed(() =>
    this.ordinaLista(
      [...this.commessaService.commesseState()],
      this.settingsCommesse().orderBy,
      this.settingsCommesse().orderDirection,
    ),
  );
  appuntamentiLista = computed(() =>
    this.ordinaLista(
      [...this.appService.appuntamentiState()],
      this.settingsAppuntamenti().orderBy,
      this.settingsAppuntamenti().orderDirection,
    ),
  );

  constructor(
    private clienteService: ClienteService,
    private indirizzoService: IndirizzoService,
    private commessaService: CommessaService,
    private preferencesService: PreferencesService,
    private appService: AppuntamentoService,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private router: Router,
  ) {
    addIcons({
      add,
      searchOutline,
      locationOutline,
      personOutline,
      filterOutline,
      businessOutline,
      personAddOutline,
      callOutline,
      documentsOutline,
      calendarOutline,
      peopleOutline,
      chevronForward,
      location,
      documents,
      storefrontOutline,
      attachOutline,
      folderOpenOutline,
      calendarNumberOutline,
      createOutline,
    });
  }

  ngOnInit() {
    this.settingsClienti.set(
      this.preferencesService.getSettings(
        'settings_clienti',
        this.settingsClienti(),
      ),
    );
    this.settingsCantieri.set(
      this.preferencesService.getSettings(
        'settings_cantieri',
        this.settingsCantieri(),
      ),
    );
    this.settingsCommesse.set(
      this.preferencesService.getSettings(
        'settings_commesse',
        this.settingsCommesse(),
      ),
    );
    this.settingsAppuntamenti.set(
      this.preferencesService.getSettings(
        'settings_appuntamenti',
        this.settingsAppuntamenti(),
      ),
    );

    this.searchSubject$
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.ricerca.set(searchTerm);
        if (this.vistaCorrente() === 'documenti') {
          if (this.listaDocComponent)
            this.listaDocComponent.caricaDocumenti(true, searchTerm);
        } else {
          // Reset pages back to 1
          if (this.vistaCorrente() === 'clienti') this.clientiPage.set(1);
          if (this.vistaCorrente() === 'cantieri') this.cantieriPage.set(1);
          if (this.vistaCorrente() === 'commesse') this.commessePage.set(1);
          if (this.vistaCorrente() === 'appuntamenti')
            this.appuntamentiPage.set(1);
          this.caricaDatiGlobale(null, true);
        }
      });

    this.caricaDatiGlobale(null, true);
  }

  // Rimossa logica bloccante e azzeramento su ionViewWillEnter 
  // per preservare lo scroll-history nativo della page.

  cambiaVista(ev: any) {
    const nuovaVista = ev.detail.value as VistaType;
    this.vistaCorrente.set(nuovaVista);
    this.ricerca.set('');
    this.caricaDatiGlobale(null, true);
  }

  gestisciRicerca(testo: string) {
    this.searchSubject$.next(testo);
  }

  caricaDatiGlobale(event?: any, forcePrimaPagina = false) {
    if (forcePrimaPagina) {
      this.isLoading.set(true);
    }
    const searchVal = this.ricerca();

    switch (this.vistaCorrente()) {
      case 'clienti':
        this.clienteService
          .getPaginated(this.clientiPage(), this.limit, searchVal)
          .subscribe({
            next: (res) => {
              this.clientiTotalPages.set(res.totalPages);
              this.isLoading.set(false);
              if (event) {
                event.target.complete();
                if (this.clientiPage() >= this.clientiTotalPages())
                  event.target.disabled = true;
              }
            },
            error: () => {
              this.isLoading.set(false);
              if (event) event.target.complete();
            },
          });
        break;
      case 'cantieri':
        this.indirizzoService
          .getPaginated(this.cantieriPage(), this.limit, searchVal)
          .subscribe({
            next: (res) => {
              this.cantieriTotalPages.set(res.totalPages);
              this.isLoading.set(false);
              if (event) {
                event.target.complete();
                if (this.cantieriPage() >= this.cantieriTotalPages())
                  event.target.disabled = true;
              }
            },
            error: () => {
              this.isLoading.set(false);
              if (event) event.target.complete();
            },
          });
        break;
      case 'commesse':
        this.commessaService
          .getPaginated(this.commessePage(), this.limit, searchVal)
          .subscribe({
            next: (res) => {
              this.commesseTotalPages.set(res.totalPages);
              this.isLoading.set(false);
              if (event) {
                event.target.complete();
                if (this.commessePage() >= this.commesseTotalPages())
                  event.target.disabled = true;
              }
            },
            error: () => {
              this.isLoading.set(false);
              if (event) event.target.complete();
            },
          });
        break;
      case 'appuntamenti':
        this.appService
          .getPaginated(this.appuntamentiPage(), this.limit, searchVal)
          .subscribe({
            next: (res) => {
              this.appuntamentiTotalPages.set(res.totalPages);
              this.isLoading.set(false);
              if (event) {
                event.target.complete();
                if (this.appuntamentiPage() >= this.appuntamentiTotalPages())
                  event.target.disabled = true;
              }
            },
            error: () => {
              this.isLoading.set(false);
              if (event) event.target.complete();
            },
          });
        break;
      case 'documenti':
        if (this.listaDocComponent)
          this.listaDocComponent.caricaDocumenti(true, searchVal);
        this.isLoading.set(false);
        if (event) event.target.complete();
        break;
    }
  }

  // Paginators Handlers
  caricaAltraPaginaClienti(event: any) {
    if (this.clientiPage() < this.clientiTotalPages()) {
      this.clientiPage.update((p) => p + 1);
      this.caricaDatiGlobale(event);
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }

  caricaAltraPaginaCantieri(event: any) {
    if (this.cantieriPage() < this.cantieriTotalPages()) {
      this.cantieriPage.update((p) => p + 1);
      this.caricaDatiGlobale(event);
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }

  caricaAltraPaginaCommesse(event: any) {
    if (this.commessePage() < this.commesseTotalPages()) {
      this.commessePage.update((p) => p + 1);
      this.caricaDatiGlobale(event);
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }

  caricaAltraPaginaAppuntamenti(event: any) {
    if (this.appuntamentiPage() < this.appuntamentiTotalPages()) {
      this.appuntamentiPage.update((p) => p + 1);
      this.caricaDatiGlobale(event);
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }

  private ordinaLista(lista: any[], campo: string, direzione: 'asc' | 'desc') {
    return lista.sort((a, b) => {
      const getVal = (obj: any, path: string) =>
        path.split('.').reduce((o, k) => (o || {})[k], obj);
      const valA = getVal(a, campo);
      const valB = getVal(b, campo);
      if (typeof valA === 'number' && typeof valB === 'number') {
        return direzione === 'asc' ? valA - valB : valB - valA;
      }
      const strA = (valA || '').toString().toLowerCase();
      const strB = (valB || '').toString().toLowerCase();
      return direzione === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }

  getPlaceholder(): string {
    switch (this.vistaCorrente()) {
      case 'clienti':
        return 'Cerca cliente...';
      case 'cantieri':
        return 'Cerca cantiere...';
      case 'commesse':
        return 'Cerca commessa...';
      case 'appuntamenti':
        return 'Cerca appuntamento...';
      case 'documenti':
        return 'Cerca documento...';
      default:
        return 'Cerca...';
    }
  }

  async apriImpostazioni(ev: any) {
    let currentSettings: ViewSettings;
    const view = this.vistaCorrente();
    if (view === 'clienti') currentSettings = this.settingsClienti();
    else if (view === 'cantieri') currentSettings = this.settingsCantieri();
    else if (view === 'commesse') currentSettings = this.settingsCommesse();
    else if (view === 'appuntamenti')
      currentSettings = this.settingsAppuntamenti();
    else return;

    const popover = await this.popoverCtrl.create({
      component: ListSettingsPopoverComponent,
      event: ev,
      componentProps: { type: view, settings: { ...currentSettings } },
    });

    await popover.present();
    const { data } = await popover.onWillDismiss();

    if (data) {
      if (view === 'clienti') {
        this.settingsClienti.set(data);
        this.preferencesService.saveSettings('settings_clienti', data);
      } else if (view === 'cantieri') {
        this.settingsCantieri.set(data);
        this.preferencesService.saveSettings('settings_cantieri', data);
      } else if (view === 'commesse') {
        this.settingsCommesse.set(data);
        this.preferencesService.saveSettings('settings_commesse', data);
      } else if (view === 'appuntamenti') {
        this.settingsAppuntamenti.set(data);
        this.preferencesService.saveSettings('settings_appuntamenti', data);
      }
    }
  }

  // Navigation and Modals
  async apriNuovoCliente() {
    this.apriModaleGlobale(NuovoClienteModalComponent);
  }
  async apriNuovoCantiere() {
    this.apriModaleGlobale(NuovoCantiereGlobaleModalComponent);
  }
  async apriNuovaCommessa() {
    this.apriModaleGlobale(NuovaCommessaGlobaleModalComponent);
  }
  async apriNuovoAppuntamento() {
    this.apriModaleGlobale(NuovoAppuntamentoGlobaleModalComponent);
  }

  private async apriModaleGlobale(component: any) {
    const m = await this.modalCtrl.create({ component });
    await m.present();
    const { data } = await m.onWillDismiss();
    if (data && data.creato) this.caricaDatiGlobale(null, true);
  }

  async goToDettaglioElemento(item: any, tipo: 'cliente' | 'cantiere' | 'commessa' | 'appuntamento' | 'fattura') {
    if (tipo === 'cliente') {
      this.router.navigate(['/tabs/tab3/cliente-dettaglio', item.id]);
    } else if (tipo === 'cantiere') {
      this.router.navigate(['/cantiere-dettaglio', item.id]);
    } else if (tipo === 'commessa') {
      this.router.navigate(['/commessa-dettaglio', item.id]);
    } else if (tipo === 'appuntamento') {
      this.router.navigate(['/appuntamento-dettaglio', item.id]);
    } else if (tipo === 'fattura') {
      // Se esiste una pagina di dettaglio fattura, altrimenti gestisci come preferito
      this.mostraFatturaDettaglio(item);
    }
  }

  async mostraFatturaDettaglio(fattura: any) {
    // Mantengo la modale per la fattura se non c'è una pagina dedicata
    const { FatturaDettaglioModalComponent } = await import('../components/fattura-dettaglio-modal/fattura-dettaglio-modal.component');
    const modal = await this.modalCtrl.create({
      component: FatturaDettaglioModalComponent,
      componentProps: { fattura }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && (data.creato || data.aggiornato || data.eliminato))
      this.caricaDatiGlobale(null, true);
  }
}
