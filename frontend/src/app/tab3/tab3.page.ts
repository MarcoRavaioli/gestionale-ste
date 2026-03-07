import { Component, OnInit, signal, effect, computed } from '@angular/core';
import { ListaClientiComponent } from '../components/lista-clienti/lista-clienti.component';
import { ListaCantieriComponent } from '../components/lista-cantieri/lista-cantieri.component';
import { ListaCommesseComponent } from '../components/lista-commesse/lista-commesse.component';
import { ListaAppuntamentiComponent } from '../components/lista-appuntamenti/lista-appuntamenti.component';

import {
  ModalController,
  PopoverController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonChip,
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
  IonNote,
  IonItemGroup,
  IonItemDivider,
  IonFab,
  IonFabButton,
  IonBadge,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClienteService } from '../services/cliente.service';
import { IndirizzoService } from '../services/indirizzo.service';
import { PreferencesService, ViewSettings } from '../services/preferences';
import {
  Appuntamento,
  Cliente,
  Commessa,
  Indirizzo,
} from '../interfaces/models';
import { NuovoClienteModalComponent } from '../components/nuovo-cliente-modal/nuovo-cliente-modal.component';
import { NuovoCantiereGlobaleModalComponent } from '../components/nuovo-cantiere-globale-modal/nuovo-cantiere-globale-modal.component';
import { NuovaCommessaGlobaleModalComponent } from '../components/nuova-commessa-globale-modal/nuova-commessa-globale-modal.component';
import { NuovoAppuntamentoGlobaleModalComponent } from '../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';
import { ListSettingsPopoverComponent } from '../components/list-settings-popover/list-settings-popover.component';
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
import { CommessaService } from '../services/commessa.service';
import { AppuntamentoService } from '../services/appuntamento.service';
import { ToastController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface GruppoCantieri {
  nome: string;
  items: Indirizzo[];
}
interface GruppoCommesse {
  nome: string;
  items: Commessa[];
}
interface GruppoAppuntamenti {
  nome: string;
  items: Appuntamento[];
}

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
    IonChip,
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
    IonNote,
    IonItemGroup,
    IonItemDivider,
    IonFab,
    IonFabButton,
    IonBadge,
    IonSkeletonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    ListaClientiComponent,
    ListaCantieriComponent,
    ListaCommesseComponent,
    ListaAppuntamentiComponent,
  ],
})
export class Tab3Page implements OnInit {
  vistaCorrente: 'clienti' | 'cantieri' | 'commesse' | 'appuntamenti' =
    'clienti';
  ricerca: string = '';
  isLoading = true;

  tuttiClienti: Cliente[] = [];
  // tuttiCantieri rimossa

  get clientiVisualizzati() {
    return this.clienteService.clientiState();
  }

  get cantieriLista() {
    return this.indirizzoService.cantieriState();
  }
  cantieriGruppi: GruppoCantieri[] = [];
  commesseLista: Commessa[] = [];
  commesseGruppi: GruppoCommesse[] = [];
  appuntamentiGruppi: GruppoAppuntamenti[] = [];
  appuntamentiLista: Appuntamento[] = [];

  isCantieriGrouped: boolean = false;
  isCommesseGrouped: boolean = false;
  isAppuntamentiGrouped: boolean = false;

  clientiPage = 1;
  clientiLimit = 15;
  clientiTotalPages = 1;
  clientiSearchSubject = new Subject<string>();

  cantieriPage = 1;
  cantieriLimit = 15;
  cantieriTotalPages = 1;
  cantieriSearchSubject = new Subject<string>();

  commessePage = 1;
  commesseLimit = 15;
  commesseTotalPages = 1;
  commesseSearchSubject = new Subject<string>();

  appuntamentiPage = 1;
  appuntamentiLimit = 15;
  appuntamentiTotalPages = 1;
  appuntamentiSearchSubject = new Subject<string>();

  settingsClienti: ViewSettings = { orderBy: 'nome', orderDirection: 'asc' };
  settingsCantieri: ViewSettings = {
    orderBy: 'citta',
    orderDirection: 'asc',
    groupBy: undefined,
  };
  settingsCommesse: ViewSettings = {
    orderBy: 'seriale',
    orderDirection: 'asc',
    groupBy: undefined,
  };
  settingsAppuntamenti: ViewSettings = {
    orderBy: 'data_ora',
    orderDirection: 'desc',
    groupBy: undefined,
  };

  constructor(
    private clienteService: ClienteService,
    private indirizzoService: IndirizzoService,
    private commessaService: CommessaService,
    private preferencesService: PreferencesService,
    private appService: AppuntamentoService,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private toastCtrl: ToastController,
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
    this.settingsClienti = this.preferencesService.getSettings(
      'settings_clienti',
      this.settingsClienti,
    );
    this.settingsCantieri = this.preferencesService.getSettings(
      'settings_cantieri',
      this.settingsCantieri,
    );
    this.settingsCommesse = this.preferencesService.getSettings(
      'settings_commesse',
      this.settingsCommesse,
    );
    this.settingsAppuntamenti = this.preferencesService.getSettings(
      'settings_appuntamenti',
      this.settingsAppuntamenti,
    );

    this.clientiSearchSubject
      .pipe(
        debounceTime(500), // Aspetta 500ms dopo l'ultimo tasto premuto
        distinctUntilChanged(), // Ignora se la parola è identica a prima
      )
      .subscribe((searchTerm) => {
        this.ricerca = searchTerm;
        this.clientiPage = 1; // Se fa una nuova ricerca, ripartiamo da pagina 1
        this.caricaClientiPaginati(null, true);
      });

    this.cantieriSearchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.ricerca = searchTerm;
        this.cantieriPage = 1;
        this.caricaCantieriPaginati(null, true);
      });


    this.commesseSearchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.ricerca = searchTerm;
        this.commessePage = 1;
        this.caricaCommessePaginati(null, true);
      });

    this.appuntamentiSearchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.ricerca = searchTerm;
        this.appuntamentiPage = 1;
        this.caricaAppuntamentiPaginati(null, true);
      });

    this.caricaDatiGlobale();
  }

  ionViewWillEnter() {
    this.caricaDatiGlobale();
  }

  caricaDatiGlobale(event?: any) {
    if (this.vistaCorrente === 'clienti') {
      this.clientiPage = 1;
      this.caricaClientiPaginati(event, true);
    } else if (this.vistaCorrente === 'cantieri') {
      this.cantieriPage = 1;
      this.caricaCantieriPaginati(event, true);
    } else if (this.vistaCorrente === 'commesse') {
      this.commessePage = 1;
      this.caricaCommessePaginati(event, true);
    } else {
      this.appuntamentiPage = 1;
      this.caricaAppuntamentiPaginati(event, true);
    }
  }

  elaboraDati() {
    if (this.vistaCorrente === 'clienti') this.caricaClientiPaginati();
    else if (this.vistaCorrente === 'cantieri') this.caricaCantieriPaginati();
    else if (this.vistaCorrente === 'commesse') this.elaboraCommesse();
    else this.elaboraAppuntamenti();
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

  caricaClientiPaginati(event?: any, isFirstLoad: boolean = false) {
    if (isFirstLoad) this.isLoading = true;

    this.clienteService
      .getPaginated(this.clientiPage, this.clientiLimit, this.ricerca)
      .subscribe({
        next: (res) => {
          this.clientiTotalPages = res.totalPages;
          this.isLoading = false;

          // Ferma la rotellina dell'infinite scroll
          if (event) {
            event.target.complete();
            // Se siamo all'ultima pagina, disabilita lo spinner per non cercare a vuoto
            if (this.clientiPage >= this.clientiTotalPages) {
              event.target.disabled = true;
            }
          }
        },
        error: () => {
          this.isLoading = false;
          if (event) event.target.complete();
        },
      });
  }

  caricaAltraPaginaClienti(event: any) {
    if (this.clientiPage < this.clientiTotalPages) {
      this.clientiPage++;
      this.caricaClientiPaginati(event, false);
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }

  caricaCantieriPaginati(event?: any, isFirstLoad: boolean = false) {
    if (isFirstLoad) this.isLoading = true;

    this.indirizzoService
      .getPaginated(this.cantieriPage, this.cantieriLimit, this.ricerca)
      .subscribe({
        next: (res) => {
          this.cantieriTotalPages = res.totalPages;
          this.isLoading = false;

          if (event) {
            event.target.complete();
            if (this.cantieriPage >= this.cantieriTotalPages)
              event.target.disabled = true;
          }
        },
        error: () => {
          this.isLoading = false;
          if (event) event.target.complete();
        },
      });
  }

  caricaAltraPaginaCantieri(event: any) {
    if (this.cantieriPage < this.cantieriTotalPages) {
      this.cantieriPage++;
      this.caricaCantieriPaginati(event, false);
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }


  caricaCommessePaginati(event?: any, isFirstLoad: boolean = false) {
    if (isFirstLoad) this.isLoading = true;

    this.commessaService
      .getPaginated(this.commessePage, this.commesseLimit, this.ricerca)
      .subscribe({
        next: (res) => {
          this.commesseTotalPages = res.totalPages;
          this.elaboraCommesse(); // Ricalcola i gruppi dopo il set del signal
          this.isLoading = false;

          if (event) {
            event.target.complete();
            if (this.commessePage >= this.commesseTotalPages) {
              event.target.disabled = true;
            }
          }
        },
        error: () => {
          this.isLoading = false;
          if (event) event.target.complete();
        },
      });
  }

  caricaAltraPaginaCommesse(event: any) {
    if (this.commessePage < this.commesseTotalPages) {
      this.commessePage++;
      this.caricaCommessePaginati(event, false);
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }

  caricaAppuntamentiPaginati(event?: any, isFirstLoad: boolean = false) {
    if (isFirstLoad) this.isLoading = true;

    this.appService
      .getPaginated(this.appuntamentiPage, this.appuntamentiLimit, this.ricerca)
      .subscribe({
        next: (res) => {
          this.appuntamentiTotalPages = res.totalPages;
          this.elaboraAppuntamenti();
          this.isLoading = false;

          if (event) {
            event.target.complete();
            if (this.appuntamentiPage >= this.appuntamentiTotalPages)
              event.target.disabled = true;
          }
        },
        error: () => {
          this.isLoading = false;
          if (event) event.target.complete();
        },
      });
  }

  caricaAltraPaginaAppuntamenti(event: any) {
    if (this.appuntamentiPage < this.appuntamentiTotalPages) {
      this.appuntamentiPage++;
      this.caricaAppuntamentiPaginati(event, false);
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }

  gestisciRicerca(testo: string) {
    if (this.vistaCorrente === 'clienti') {
      this.clientiSearchSubject.next(testo);
    } else if (this.vistaCorrente === 'cantieri') {
      this.cantieriSearchSubject.next(testo);
    } else if (this.vistaCorrente === 'commesse') {
      this.commesseSearchSubject.next(testo);
    } else {
      this.appuntamentiSearchSubject.next(testo);
    }
  }

  cambiaVista(nuovaVista: any) {
    this.vistaCorrente = nuovaVista;
    this.ricerca = ''; // Azzera la ricerca cambiando tab
    this.caricaDatiGlobale(); // Ricarica/Ri-elabora
  }

  elaboraCommesse() {
    let dati = [...this.commessaService.commesseState()];

    dati = this.ordinaLista(
      dati,
      this.settingsCommesse.orderBy,
      this.settingsCommesse.orderDirection,
    );

    if (this.settingsCommesse.groupBy) {
      this.isCommesseGrouped = true;
      const field = this.settingsCommesse.groupBy;
      const gruppi: { [key: string]: Commessa[] } = {};

      dati.forEach((item) => {
        let key = 'Altro';
        switch (field) {
          case 'stato':
            key = item.stato;
            break;
          case 'cantiere':
            key = item.indirizzo
              ? `${item.indirizzo.citta}, ${item.indirizzo.via}`
              : 'Nessun Cantiere';
            break;
          case 'cliente':
            key =
              item.cliente?.nome ||
              item.indirizzo?.cliente?.nome ||
              'Nessun Cliente';
            break;
          default:
            key = (item as any)[field] || 'Altro';
        }

        if (!gruppi[key]) gruppi[key] = [];
        gruppi[key].push(item);
      });

      this.commesseGruppi = Object.keys(gruppi)
        .sort()
        .map((key) => ({ nome: key, items: gruppi[key] }));
      this.commesseLista = [];
    } else {
      this.isCommesseGrouped = false;
      this.commesseLista = dati;
      this.commesseGruppi = [];
    }
  }

  elaboraAppuntamenti() {
    let dati = [...this.appService.appuntamentiState()];

    dati = this.ordinaLista(
      dati,
      this.settingsAppuntamenti.orderBy,
      this.settingsAppuntamenti.orderDirection,
    );

    if (this.settingsAppuntamenti.groupBy) {
      this.isAppuntamentiGrouped = true;
      const field = this.settingsAppuntamenti.groupBy;
      const gruppiMap = new Map<string, Appuntamento[]>();

      dati.forEach((app) => {
        let key = 'Altro';
        const dataObj = new Date(app.data_ora);

        switch (field) {
          case 'giorno':
            key = dataObj.toLocaleDateString('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            });
            break;
          case 'settimana':
            const onejan = new Date(dataObj.getFullYear(), 0, 1);
            const week = Math.ceil(
              ((dataObj.getTime() - onejan.getTime()) / 86400000 +
                onejan.getDay() +
                1) /
                7,
            );
            key = `Settimana ${week} - ${dataObj.getFullYear()}`;
            break;
          case 'mese':
            key = dataObj.toLocaleDateString('it-IT', {
              month: 'long',
              year: 'numeric',
            });
            break;
          case 'anno':
            key = dataObj.getFullYear().toString();
            break;
          case 'commessa':
            key = app.commessa
              ? `${app.commessa.seriale} ${app.commessa.descrizione || ''}`
              : 'Nessuna Commessa';
            break;
          case 'cantiere':
            key = app.indirizzo
              ? `${app.indirizzo.citta}`
              : app.commessa?.indirizzo
                ? `${app.commessa.indirizzo.citta}`
                : 'Nessun Cantiere';
            break;
          case 'cliente':
            key =
              app.cliente?.nome ||
              app.indirizzo?.cliente?.nome ||
              app.commessa?.cliente?.nome ||
              app.commessa?.indirizzo?.cliente?.nome ||
              'Nessun Cliente';
            break;
        }

        key = key.charAt(0).toUpperCase() + key.slice(1);
        if (!gruppiMap.has(key)) gruppiMap.set(key, []);
        gruppiMap.get(key)!.push(app);
      });

      this.appuntamentiGruppi = Array.from(gruppiMap.keys()).map((k) => ({
        nome: k,
        items: gruppiMap.get(k)!,
      }));
      this.appuntamentiLista = [];
    } else {
      this.isAppuntamentiGrouped = false;
      this.appuntamentiLista = dati;
      this.appuntamentiGruppi = [];
    }
  }

  async apriImpostazioni(ev: any) {
    let currentSettings;
    if (this.vistaCorrente === 'clienti')
      currentSettings = this.settingsClienti;
    else if (this.vistaCorrente === 'cantieri')
      currentSettings = this.settingsCantieri;
    else if (this.vistaCorrente === 'commesse')
      currentSettings = this.settingsCommesse;
    else currentSettings = this.settingsAppuntamenti;

    const popover = await this.popoverCtrl.create({
      component: ListSettingsPopoverComponent,
      event: ev,
      componentProps: {
        type: this.vistaCorrente,
        settings: { ...currentSettings },
      },
    });
    await popover.present();
    const { data } = await popover.onWillDismiss();

    if (data) {
      if (this.vistaCorrente === 'clienti') {
        this.settingsClienti = data;
        this.preferencesService.saveSettings('settings_clienti', data);
      } else if (this.vistaCorrente === 'cantieri') {
        this.settingsCantieri = data;
        this.preferencesService.saveSettings('settings_cantieri', data);
      } else if (this.vistaCorrente === 'commesse') {
        this.settingsCommesse = data;
        this.preferencesService.saveSettings('settings_commesse', data);
      } else {
        this.settingsAppuntamenti = data;
        this.preferencesService.saveSettings('settings_appuntamenti', data);
      }
      this.elaboraDati();
    }
  }

  async apriNuovoCliente() {
    const m = await this.modalCtrl.create({
      component: NuovoClienteModalComponent,
    });
    await m.present();
    const { data } = await m.onWillDismiss();
    if (data && data.creato) this.caricaDatiGlobale();
  }
  async apriNuovoCantiere() {
    const m = await this.modalCtrl.create({
      component: NuovoCantiereGlobaleModalComponent,
    });
    await m.present();
    const { data } = await m.onWillDismiss();
    if (data && data.creato) this.caricaDatiGlobale();
  }
  async apriNuovaCommessa() {
    const m = await this.modalCtrl.create({
      component: NuovaCommessaGlobaleModalComponent,
    });
    await m.present();
    const { data } = await m.onWillDismiss();
    if (data && data.creato) this.caricaDatiGlobale();
  }
  async apriNuovoAppuntamento() {
    const m = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
    });
    await m.present();
    const { data } = await m.onWillDismiss();
    if (data && data.creato) this.caricaDatiGlobale();
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

  getPlaceholder(): string {
    switch (this.vistaCorrente) {
      case 'clienti':
        return 'Cerca cliente...';
      case 'cantieri':
        return 'Cerca cantiere...';
      case 'commesse':
        return 'Cerca commessa...';
      case 'appuntamenti':
        return 'Cerca appuntamento...';
      default:
        return 'Cerca...';
    }
  }

  // --- LOGICA DI NAVIGAZIONE POTENZIATA PER IL GRAFO FLESSIBILE ---
  async goToDettaglioElemento(
    item: any,
    tipo: 'cliente' | 'cantiere' | 'commessa' | 'appuntamento',
  ) {
    let targetClienteId = null;
    const queryParams: any = {};

    if (tipo === 'cliente') {
      targetClienteId = item.id;
    } else if (tipo === 'cantiere') {
      targetClienteId = item.cliente?.id;
      queryParams.cantiereId = item.id;
    } else if (tipo === 'commessa') {
      targetClienteId = item.cliente?.id || item.indirizzo?.cliente?.id;
      if (item.indirizzo) queryParams.cantiereId = item.indirizzo.id;
      queryParams.commessaId = item.id;
    } else if (tipo === 'appuntamento') {
      targetClienteId =
        item.cliente?.id ||
        item.indirizzo?.cliente?.id ||
        item.commessa?.cliente?.id ||
        item.commessa?.indirizzo?.cliente?.id;
      if (item.indirizzo) queryParams.cantiereId = item.indirizzo.id;
      if (item.commessa?.indirizzo)
        queryParams.cantiereId = item.commessa.indirizzo.id;
      if (item.commessa) queryParams.commessaId = item.commessa.id;
      queryParams.appuntamentoId = item.id;
    }

    if (targetClienteId) {
      // Trovato il proprietario! Naviga al dettaglio cliente.
      this.router.navigate(['/cliente-dettaglio', targetClienteId], {
        queryParams,
      });
    } else {
      // Elemento totalmente slegato (orfano) -> Apri modale di modifica
      let componentToOpen: any;
      let propsToPass: any = {};

      if (tipo === 'appuntamento') {
        componentToOpen = NuovoAppuntamentoGlobaleModalComponent;
        propsToPass = { appuntamento: item };
      } else if (tipo === 'commessa') {
        this.toastCtrl
          .create({
            message: 'Questa è una Commessa Interna',
            duration: 2000,
            color: 'primary',
          })
          .then((t) => t.present());
        return;
      } else if (tipo === 'cantiere') {
        // ROTTA AL NUOVO DETTAGLIO CANTIERE ORFANO!
        this.router.navigate(['/cantiere-dettaglio', item.id]);
        return;
      }

      if (componentToOpen) {
        const modal = await this.modalCtrl.create({
          component: componentToOpen,
          componentProps: propsToPass,
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();
        if (data && (data.creato || data.aggiornato || data.eliminato))
          this.caricaDatiGlobale();
      }
    }
  }
}
