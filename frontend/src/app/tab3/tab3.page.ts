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
import { IndirizzoService } from '../services/indirizzo';
import { PreferencesService, ViewSettings } from '../services/preferences';
import { Cliente, Commessa, Indirizzo } from '../interfaces/models';
import { NuovoClienteModalComponent } from '../components/nuovo-cliente-modal/nuovo-cliente-modal.component';
import { NuovoCantiereGlobaleModalComponent } from '../components/nuovo-cantiere-globale-modal/nuovo-cantiere-globale-modal.component';
import { NuovaCommessaGlobaleModalComponent } from '../components/nuova-commessa-globale-modal/nuova-commessa-globale-modal.component';
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
} from 'ionicons/icons';
import { CommessaService } from '../services/commessa.service';

interface GruppoCantieri {
  nome: string;
  items: Indirizzo[];
}

interface GruppoCommesse {
  nome: string;
  items: Commessa[];
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class Tab3Page implements OnInit {
  vistaCorrente: 'clienti' | 'cantieri' | 'commesse' = 'clienti';
  ricerca: string = '';

  // DATI RAW
  tuttiClienti: Cliente[] = [];
  tuttiCantieri: Indirizzo[] = [];
  tutteCommesse: Commessa[] = [];

  // DATI VISUALIZZATI
  clientiVisualizzati: Cliente[] = [];

  // MODIFICA QUI: Usiamo due variabili separate per evitare confusione di tipi
  cantieriLista: Indirizzo[] = [];
  cantieriGruppi: GruppoCantieri[] = [];
  commesseLista: Commessa[] = [];
  commesseGruppi: GruppoCommesse[] = [];

  isCantieriGrouped: boolean = false;
  isCommesseGrouped: boolean = false;

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

  constructor(
    private clienteService: ClienteService,
    private indirizzoService: IndirizzoService,
    private commessaService: CommessaService,
    private preferencesService: PreferencesService,
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
  }

  cambiaVista(event: any) {
    this.vistaCorrente = event.detail.value;
    this.elaboraDati();
  }

  elaboraDati() {
    if (this.vistaCorrente === 'clienti') {
      this.elaboraClienti();
    } else if (this.vistaCorrente === 'cantieri') {
      this.elaboraCantieri();
    } else if (this.vistaCorrente === 'commesse') {
      this.elaboraCommesse();
    }
  }

  private ordinaLista(lista: any[], campo: string, direzione: 'asc' | 'desc') {
    return lista.sort((a, b) => {
      // Supporto per campi annidati (es. 'cliente.nome')
      const getVal = (obj: any, path: string) => path.split('.').reduce((o, k) => (o || {})[k], obj);

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
    this.clientiVisualizzati = this.ordinaLista(dati, this.settingsClienti.orderBy, this.settingsClienti.orderDirection);
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

    dati = this.ordinaLista(dati, this.settingsCantieri.orderBy, this.settingsCantieri.orderDirection);

    // MODIFICA QUI: Popoliamo la lista corretta in base al raggruppamento
    if (this.settingsCantieri.groupBy) {
      this.isCantieriGrouped = true;
      const field = this.settingsCantieri.groupBy;

      const gruppi: { [key: string]: Indirizzo[] } = {};
      dati.forEach((item) => {
        const key = (item as any)[field] || 'Altro';
        if (!gruppi[key]) gruppi[key] = [];
        gruppi[key].push(item);
      });

      this.cantieriGruppi = Object.keys(gruppi)
        .sort()
        .map((key) => ({
          nome: key,
          items: gruppi[key],
        }));
      this.cantieriLista = []; // Svuotiamo l'altra lista per sicurezza
    } else {
      this.isCantieriGrouped = false;
      this.cantieriLista = dati;
      this.cantieriGruppi = []; // Svuotiamo l'altra lista
    }
  }

  elaboraCommesse() {
    let dati = [...this.tutteCommesse];
    const term = this.ricerca.toLowerCase();

    // 1. Filtro
    if (term) {
      dati = dati.filter(
        (c) =>
          c.seriale.toLowerCase().includes(term) ||
          c.descrizione?.toLowerCase().includes(term) ||
          c.indirizzo?.cliente?.nome.toLowerCase().includes(term) // Cerca anche per cliente
      );
    }

    dati = this.ordinaLista(dati, this.settingsCommesse.orderBy, this.settingsCommesse.orderDirection);

    // 3. Raggruppamento
    if (this.settingsCommesse.groupBy) {
      this.isCommesseGrouped = true;
      const field = this.settingsCommesse.groupBy;

      const gruppi: { [key: string]: Commessa[] } = {};
      dati.forEach((item) => {
        const key = (item as any)[field] || 'Altro';
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

  async apriImpostazioni(ev: any) {
    // 1. Determiniamo quali impostazioni caricare in base alla vista attuale
    let currentSettings;

    if (this.vistaCorrente === 'clienti') {
      currentSettings = this.settingsClienti;
    } else if (this.vistaCorrente === 'cantieri') {
      currentSettings = this.settingsCantieri;
    } else {
      // Caso 'commesse'
      currentSettings = this.settingsCommesse;
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
      } else {
        // Caso 'commesse'
        this.settingsCommesse = data;
        this.preferencesService.saveSettings('settings_commesse', data);
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
      component: NuovaCommessaGlobaleModalComponent
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    
    if (data && data.creato) {
      this.caricaDati();
    }
  }

  getColoreStato(stato: string): string {
    switch (stato) {
      case 'APERTA': return 'success';   // Verde
      case 'IN_CORSO': return 'warning'; // Giallo/Arancio
      case 'CHIUSA': return 'medium';    // Grigio
      default: return 'primary';
    }
  }
}
