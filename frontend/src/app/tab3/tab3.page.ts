import { Component, OnInit } from '@angular/core';
import {
  IonicModule,
  ModalController,
  PopoverController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
} from 'ionicons/icons';
import { CommessaService } from '../services/commessa.service';
import { AppuntamentoService } from '../services/appuntamento.service';

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
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class Tab3Page implements OnInit {
  vistaCorrente: 'clienti' | 'cantieri' | 'commesse' | 'appuntamenti' =
    'clienti';
  ricerca: string = '';

  // DATI RAW
  tuttiClienti: Cliente[] = [];
  tuttiCantieri: Indirizzo[] = [];
  tutteCommesse: Commessa[] = [];
  tuttiAppuntamenti: Appuntamento[] = [];

  // DATI VISUALIZZATI
  clientiVisualizzati: Cliente[] = [];

  // MODIFICA QUI: Usiamo due variabili separate per evitare confusione di tipi
  cantieriLista: Indirizzo[] = [];
  cantieriGruppi: GruppoCantieri[] = [];
  commesseLista: Commessa[] = [];
  commesseGruppi: GruppoCommesse[] = [];
  appuntamentiGruppi: GruppoAppuntamenti[] = [];
  appuntamentiLista: Appuntamento[] = [];

  isCantieriGrouped: boolean = false;
  isCommesseGrouped: boolean = false;
  isAppuntamentiGrouped: boolean = false;

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
    private popoverCtrl: PopoverController
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
    });
  }

  ngOnInit() {
    this.settingsClienti = this.preferencesService.getSettings(
      'settings_clienti',
      this.settingsClienti
    );
    this.settingsCantieri = this.preferencesService.getSettings(
      'settings_cantieri',
      this.settingsCantieri
    );
    this.settingsCommesse = this.preferencesService.getSettings(
      'settings_commesse',
      this.settingsCommesse
    );
    this.settingsAppuntamenti = this.preferencesService.getSettings(
      'settings_appuntamenti',
      this.settingsAppuntamenti
    );
    this.caricaDati();
  }

  ionViewWillEnter() {
    this.caricaDati();
  }

  caricaDati(event?: any) {
    this.clienteService.getAll().subscribe((clienti) => {
      this.tuttiClienti = clienti;
      this.elaboraDati();
    });

    this.indirizzoService.getAll().subscribe((cantieri) => {
      this.tuttiCantieri = cantieri;
      this.elaboraDati();
      if (event) event.target.complete();
    });

    this.commessaService.getAll().subscribe((commesse) => {
      this.tutteCommesse = commesse;
      this.elaboraDati();
      if (event) event.target.complete();
    });

    this.appService.getAll().subscribe((apps) => {
      this.tuttiAppuntamenti = apps;
      this.elaboraDati();
      if (event) event.target.complete();
    });
  }

  cambiaVista(nuovaVista: any) {
    this.vistaCorrente = nuovaVista;
    this.elaboraDati();
    //this.content.scrollToTop(300);
  }

  elaboraDati() {
    if (this.vistaCorrente === 'clienti') this.elaboraClienti();
    else if (this.vistaCorrente === 'cantieri') this.elaboraCantieri();
    else if (this.vistaCorrente === 'commesse') this.elaboraCommesse();
    else this.elaboraAppuntamenti();
  }

  private ordinaLista(lista: any[], campo: string, direzione: 'asc' | 'desc') {
    return lista.sort((a, b) => {
      // Supporto per campi annidati (es. 'cliente.nome')
      const getVal = (obj: any, path: string) =>
        path.split('.').reduce((o, k) => (o || {})[k], obj);

      const valA = getVal(a, campo);
      const valB = getVal(b, campo);

      // Se sono numeri (es. ID o Valore Totale), sottraiamo
      if (typeof valA === 'number' && typeof valB === 'number') {
        return direzione === 'asc' ? valA - valB : valB - valA;
      }

      // Altrimenti usiamo comparazione stringhe
      const strA = (valA || '').toString().toLowerCase();
      const strB = (valB || '').toString().toLowerCase();

      return direzione === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }

  elaboraClienti() {
    let dati = [...this.tuttiClienti];
    const term = this.ricerca.toLowerCase();
    if (term) {
      dati = dati.filter(
        (c) =>
          c.nome.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term)
      );
    }
    this.clientiVisualizzati = this.ordinaLista(
      dati,
      this.settingsClienti.orderBy,
      this.settingsClienti.orderDirection
    );
  }

  elaboraCantieri() {
    let dati = [...this.tuttiCantieri];
    const term = this.ricerca.toLowerCase();

    if (term) {
      dati = dati.filter(
        (i) =>
          i.via.toLowerCase().includes(term) ||
          i.citta.toLowerCase().includes(term) ||
          i.cliente?.nome.toLowerCase().includes(term)
      );
    }

    dati = this.ordinaLista(
      dati,
      this.settingsCantieri.orderBy,
      this.settingsCantieri.orderDirection
    );

    // RAGGRUPPAMENTO AGGIORNATO
    if (this.settingsCantieri.groupBy) {
      this.isCantieriGrouped = true;
      const field = this.settingsCantieri.groupBy;

      const gruppi: { [key: string]: Indirizzo[] } = {};

      dati.forEach((item) => {
        let key = 'Altro';

        // Gestione specifica per campi complessi
        if (field === 'cliente') {
          key = item.cliente?.nome || 'Nessun Cliente';
        } else {
          // Caso standard (citta, provincia, cap)
          key = (item as any)[field] || 'Altro';
        }

        // Maiuscolo per estetica
        key = key.toString().toUpperCase();

        if (!gruppi[key]) gruppi[key] = [];
        gruppi[key].push(item);
      });

      this.cantieriGruppi = Object.keys(gruppi)
        .sort()
        .map((key) => ({
          nome: key,
          items: gruppi[key],
        }));
      this.cantieriLista = [];
    } else {
      this.isCantieriGrouped = false;
      this.cantieriLista = dati;
      this.cantieriGruppi = [];
    }
  }

  elaboraCommesse() {
    let dati = [...this.tutteCommesse];
    const term = this.ricerca.toLowerCase();

    if (term) {
      dati = dati.filter(
        (c) =>
          c.seriale.toLowerCase().includes(term) ||
          c.descrizione?.toLowerCase().includes(term) ||
          c.indirizzo?.cliente?.nome.toLowerCase().includes(term)
      );
    }

    dati = this.ordinaLista(
      dati,
      this.settingsCommesse.orderBy,
      this.settingsCommesse.orderDirection
    );

    // RAGGRUPPAMENTO AGGIORNATO
    if (this.settingsCommesse.groupBy) {
      this.isCommesseGrouped = true;
      const field = this.settingsCommesse.groupBy;

      const gruppi: { [key: string]: Commessa[] } = {};

      dati.forEach((item) => {
        let key = 'Altro';

        // Switch per gestire i raggruppamenti complessi
        switch (field) {
          case 'stato':
            key = item.stato;
            break;
          case 'cantiere':
            // Raggruppa per "Città, Via"
            key = item.indirizzo
              ? `${item.indirizzo.citta}, ${item.indirizzo.via}`
              : 'Nessun Cantiere';
            break;
          case 'cliente':
            // Raggruppa per Nome Cliente
            key = item.indirizzo?.cliente?.nome || 'Nessun Cliente';
            break;
          default:
            key = (item as any)[field] || 'Altro';
        }

        if (!gruppi[key]) gruppi[key] = [];
        gruppi[key].push(item);
      });

      this.commesseGruppi = Object.keys(gruppi)
        .sort()
        .map((key) => ({
          nome: key,
          items: gruppi[key],
        }));
      this.commesseLista = [];
    } else {
      this.isCommesseGrouped = false;
      this.commesseLista = dati;
      this.commesseGruppi = [];
    }
  }

  elaboraAppuntamenti() {
    let dati = [...this.tuttiAppuntamenti];
    const term = this.ricerca.toLowerCase();

    // 1. Filtro
    if (term) {
      dati = dati.filter(
        (a) =>
          a.nome.toLowerCase().includes(term) ||
          a.commessa?.indirizzo?.cliente?.nome.toLowerCase().includes(term) ||
          a.commessa?.indirizzo?.citta.toLowerCase().includes(term)
      );
    }

    // 2. Ordinamento (Sempre necessario prima di raggruppare)
    dati = this.ordinaLista(
      dati,
      this.settingsAppuntamenti.orderBy,
      this.settingsAppuntamenti.orderDirection
    );

    // 3. Raggruppamento
    if (this.settingsAppuntamenti.groupBy) {
      this.isAppuntamentiGrouped = true;
      const field = this.settingsAppuntamenti.groupBy;

      // Usiamo una Map per mantenere l'ordine di inserimento (che segue l'ordinamento dei dati)
      const gruppiMap = new Map<string, Appuntamento[]>();

      dati.forEach((app) => {
        let key = 'Altro';
        const dataObj = new Date(app.data_ora);

        // Calcolo della chiave in base al tipo di raggruppamento
        switch (field) {
          case 'giorno':
            key = dataObj.toLocaleDateString('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            });
            break;
          case 'settimana':
            // Calcolo approssimativo settimana
            const onejan = new Date(dataObj.getFullYear(), 0, 1);
            const week = Math.ceil(
              ((dataObj.getTime() - onejan.getTime()) / 86400000 +
                onejan.getDay() +
                1) /
                7
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
            key = app.commessa ? `${app.commessa.seriale}` : 'Nessuna Commessa';
            if (app.commessa?.descrizione)
              key += ` - ${app.commessa.descrizione}`;
            break;
          case 'cantiere':
            key = app.commessa?.indirizzo
              ? `${app.commessa.indirizzo.citta}, ${app.commessa.indirizzo.via}`
              : 'Nessun Cantiere';
            break;
          case 'cliente':
            key = app.commessa?.indirizzo?.cliente?.nome || 'Nessun Cliente';
            break;
        }

        // Prima lettera maiuscola per estetica
        key = key.charAt(0).toUpperCase() + key.slice(1);

        if (!gruppiMap.has(key)) {
          gruppiMap.set(key, []);
        }
        gruppiMap.get(key)!.push(app);
      });

      // Trasforma la Map in Array per l'HTML
      this.appuntamentiGruppi = Array.from(gruppiMap.keys()).map((k) => ({
        nome: k,
        items: gruppiMap.get(k)!,
      }));

      this.appuntamentiLista = []; // Pulisce lista piatta
    } else {
      this.isAppuntamentiGrouped = false;
      this.appuntamentiLista = dati;
      this.appuntamentiGruppi = [];
    }
  }

  async apriImpostazioni(ev: any) {
    // 1. Determiniamo quali impostazioni caricare in base alla vista attuale
    let currentSettings;

    if (this.vistaCorrente === 'clienti') {
      currentSettings = this.settingsClienti;
    } else if (this.vistaCorrente === 'cantieri') {
      currentSettings = this.settingsCantieri;
    } else if (this.vistaCorrente === 'commesse') {
      currentSettings = this.settingsCommesse;
    } else {
      currentSettings = this.settingsAppuntamenti;
    }

    const popover = await this.popoverCtrl.create({
      component: ListSettingsPopoverComponent,
      event: ev,
      componentProps: {
        type: this.vistaCorrente, // Passa 'clienti', 'cantieri' o 'commesse'
        settings: { ...currentSettings }, // Passa una copia dei settaggi attuali
      },
    });

    await popover.present();

    const { data } = await popover.onWillDismiss();

    // 2. Se l'utente ha salvato (data esiste), aggiorniamo la variabile giusta
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

      // 3. Ricalcoliamo la lista con i nuovi filtri/ordinamenti
      this.elaboraDati();
    }
  }

  async apriNuovoCliente() {
    const modal = await this.modalCtrl.create({
      component: NuovoClienteModalComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) this.caricaDati();
  }

  async apriNuovoCantiere() {
    const modal = await this.modalCtrl.create({
      component: NuovoCantiereGlobaleModalComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) this.caricaDati();
  }

  async apriNuovaCommessa() {
    const modal = await this.modalCtrl.create({
      component: NuovaCommessaGlobaleModalComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data && data.creato) {
      this.caricaDati();
    }
  }

  async apriNuovoAppuntamento() {
    const modal = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) this.caricaDati();
  }

  getColoreStato(stato: string): string {
    switch (stato) {
      case 'APERTA':
        return 'success'; // Verde
      case 'IN_CORSO':
        return 'warning'; // Giallo/Arancio
      case 'CHIUSA':
        return 'medium'; // Grigio
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
}
