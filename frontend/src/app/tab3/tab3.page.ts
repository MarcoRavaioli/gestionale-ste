import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClienteService } from '../services/cliente.service';
import { IndirizzoService } from '../services/indirizzo';
import { PreferencesService, ViewSettings } from '../services/preferences';
import { Cliente, Indirizzo } from '../interfaces/models';
import { NuovoClienteModalComponent } from '../components/nuovo-cliente-modal/nuovo-cliente-modal.component';
import { NuovoCantiereGlobaleModalComponent } from '../components/nuovo-cantiere-globale-modal/nuovo-cantiere-globale-modal.component';
import { ListSettingsPopoverComponent } from '../components/list-settings-popover/list-settings-popover.component';
import { addIcons } from 'ionicons';
import { add, searchOutline, locationOutline, personOutline, filterOutline, businessOutline, personAddOutline, callOutline } from 'ionicons/icons';

interface GruppoCantieri {
  nome: string;
  items: Indirizzo[];
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class Tab3Page implements OnInit {
  
  vistaCorrente: 'clienti' | 'cantieri' = 'clienti';
  ricerca: string = '';

  // DATI RAW
  tuttiClienti: Cliente[] = [];
  tuttiCantieri: Indirizzo[] = [];

  // DATI VISUALIZZATI
  clientiVisualizzati: Cliente[] = [];
  
  // MODIFICA QUI: Usiamo due variabili separate per evitare confusione di tipi
  cantieriLista: Indirizzo[] = [];
  cantieriGruppi: GruppoCantieri[] = [];
  
  isCantieriGrouped: boolean = false;

  settingsClienti: ViewSettings = { orderBy: 'nome', orderDirection: 'asc' };
  settingsCantieri: ViewSettings = { orderBy: 'citta', orderDirection: 'asc', groupBy: undefined };

  constructor(
    private clienteService: ClienteService,
    private indirizzoService: IndirizzoService,
    private preferencesService: PreferencesService,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController
  ) {
    addIcons({ add, searchOutline, locationOutline, personOutline, filterOutline, businessOutline, personAddOutline, callOutline });
  }

  ngOnInit() {
    this.settingsClienti = this.preferencesService.getSettings('settings_clienti', this.settingsClienti);
    this.settingsCantieri = this.preferencesService.getSettings('settings_cantieri', this.settingsCantieri);
    this.caricaDati();
  }

  ionViewWillEnter() { this.caricaDati(); }

  caricaDati(event?: any) {
    this.clienteService.getAll().subscribe(clienti => {
      this.tuttiClienti = clienti;
      this.elaboraDati();
    });

    this.indirizzoService.getAll().subscribe(cantieri => {
      this.tuttiCantieri = cantieri;
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
    } else {
      this.elaboraCantieri();
    }
  }

  elaboraClienti() {
    let dati = [...this.tuttiClienti];
    const term = this.ricerca.toLowerCase();
    if (term) {
      dati = dati.filter(c => c.nome.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term));
    }
    dati.sort((a, b) => {
      const fieldA = (a as any)[this.settingsClienti.orderBy]?.toString().toLowerCase() || '';
      const fieldB = (b as any)[this.settingsClienti.orderBy]?.toString().toLowerCase() || '';
      return this.settingsClienti.orderDirection === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
    });
    this.clientiVisualizzati = dati;
  }

  elaboraCantieri() {
    let dati = [...this.tuttiCantieri];
    const term = this.ricerca.toLowerCase();
    if (term) {
      dati = dati.filter(i => 
        i.via.toLowerCase().includes(term) || 
        i.citta.toLowerCase().includes(term) ||
        i.cliente?.nome.toLowerCase().includes(term)
      );
    }

    dati.sort((a, b) => {
      const fieldA = (a as any)[this.settingsCantieri.orderBy]?.toString().toLowerCase() || '';
      const fieldB = (b as any)[this.settingsCantieri.orderBy]?.toString().toLowerCase() || '';
      return this.settingsCantieri.orderDirection === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
    });

    // MODIFICA QUI: Popoliamo la lista corretta in base al raggruppamento
    if (this.settingsCantieri.groupBy) {
      this.isCantieriGrouped = true;
      const field = this.settingsCantieri.groupBy;
      
      const gruppi: {[key: string]: Indirizzo[]} = {};
      dati.forEach(item => {
        const key = (item as any)[field] || 'Altro';
        if (!gruppi[key]) gruppi[key] = [];
        gruppi[key].push(item);
      });

      this.cantieriGruppi = Object.keys(gruppi).sort().map(key => ({
        nome: key,
        items: gruppi[key]
      }));
      this.cantieriLista = []; // Svuotiamo l'altra lista per sicurezza

    } else {
      this.isCantieriGrouped = false;
      this.cantieriLista = dati;
      this.cantieriGruppi = []; // Svuotiamo l'altra lista
    }
  }

  async apriImpostazioni(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: ListSettingsPopoverComponent,
      event: ev,
      componentProps: {
        type: this.vistaCorrente,
        settings: this.vistaCorrente === 'clienti' ? { ...this.settingsClienti } : { ...this.settingsCantieri }
      }
    });

    await popover.present();

    const { data } = await popover.onWillDismiss();
    if (data) {
      if (this.vistaCorrente === 'clienti') {
        this.settingsClienti = data;
        this.preferencesService.saveSettings('settings_clienti', data);
      } else {
        this.settingsCantieri = data;
        this.preferencesService.saveSettings('settings_cantieri', data);
      }
      this.elaboraDati();
    }
  }

  async apriNuovoCliente() {
    const modal = await this.modalCtrl.create({ component: NuovoClienteModalComponent });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) this.caricaDati();
  }

  async apriNuovoCantiere() {
    const modal = await this.modalCtrl.create({ component: NuovoCantiereGlobaleModalComponent });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) this.caricaDati();
  }
}