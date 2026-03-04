import { Component, OnInit } from '@angular/core';
import {
  ModalController,
  PopoverController,
  IonHeader, IonToolbar, IonTitle, IonChip, IonLabel, IonSearchbar, IonButton, 
  IonIcon, IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, 
  IonAvatar, IonNote, IonItemGroup, IonItemDivider, IonFab, IonFabButton, IonBadge, IonSkeletonText
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClienteService } from '../services/cliente.service';
import { IndirizzoService } from '../services/indirizzo.service';
import { PreferencesService, ViewSettings } from '../services/preferences';
import { Appuntamento, Cliente, Commessa, Indirizzo } from '../interfaces/models';
import { NuovoClienteModalComponent } from '../components/nuovo-cliente-modal/nuovo-cliente-modal.component';
import { NuovoCantiereGlobaleModalComponent } from '../components/nuovo-cantiere-globale-modal/nuovo-cantiere-globale-modal.component';
import { NuovaCommessaGlobaleModalComponent } from '../components/nuova-commessa-globale-modal/nuova-commessa-globale-modal.component';
import { NuovoAppuntamentoGlobaleModalComponent } from '../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';
import { ListSettingsPopoverComponent } from '../components/list-settings-popover/list-settings-popover.component';
import { addIcons } from 'ionicons';
import {
  add, searchOutline, locationOutline, personOutline, filterOutline, businessOutline,
  personAddOutline, callOutline, documentsOutline, calendarOutline, peopleOutline,
  chevronForward, location, documents, storefrontOutline, attachOutline, folderOpenOutline, calendarNumberOutline, createOutline,
} from 'ionicons/icons';
import { CommessaService } from '../services/commessa.service';
import { AppuntamentoService } from '../services/appuntamento.service';
import { ToastController } from '@ionic/angular';

interface GruppoCantieri { nome: string; items: Indirizzo[]; }
interface GruppoCommesse { nome: string; items: Commessa[]; }
interface GruppoAppuntamenti { nome: string; items: Appuntamento[]; }

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonChip, IonLabel, IonSearchbar, IonButton, 
    IonIcon, IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, 
    IonAvatar, IonNote, IonItemGroup, IonItemDivider, IonFab, IonFabButton, IonBadge, IonSkeletonText
  ],
})
export class Tab3Page implements OnInit {
  vistaCorrente: 'clienti' | 'cantieri' | 'commesse' | 'appuntamenti' = 'clienti';
  ricerca: string = '';
  isLoading = true;

  tuttiClienti: Cliente[] = [];
  tuttiCantieri: Indirizzo[] = [];
  tutteCommesse: Commessa[] = [];
  tuttiAppuntamenti: Appuntamento[] = [];

  clientiVisualizzati: Cliente[] = [];

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
  settingsCantieri: ViewSettings = { orderBy: 'citta', orderDirection: 'asc', groupBy: undefined };
  settingsCommesse: ViewSettings = { orderBy: 'seriale', orderDirection: 'asc', groupBy: undefined };
  settingsAppuntamenti: ViewSettings = { orderBy: 'data_ora', orderDirection: 'desc', groupBy: undefined };

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
    addIcons({ add, searchOutline, locationOutline, personOutline, filterOutline, businessOutline, personAddOutline, callOutline, documentsOutline, calendarOutline, peopleOutline, chevronForward, location, documents, storefrontOutline, attachOutline, folderOpenOutline, calendarNumberOutline, createOutline });
  }

  ngOnInit() {
    this.settingsClienti = this.preferencesService.getSettings('settings_clienti', this.settingsClienti);
    this.settingsCantieri = this.preferencesService.getSettings('settings_cantieri', this.settingsCantieri);
    this.settingsCommesse = this.preferencesService.getSettings('settings_commesse', this.settingsCommesse);
    this.settingsAppuntamenti = this.preferencesService.getSettings('settings_appuntamenti', this.settingsAppuntamenti);
    this.caricaDati();
  }

  ionViewWillEnter() { this.caricaDati(); }

  caricaDati(event?: any) {
    this.isLoading = true;
    this.clienteService.getAll().subscribe((clienti) => {
      this.tuttiClienti = clienti;
      this.elaboraDati();
      this.isLoading = false;
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
  }

  elaboraDati() {
    if (this.vistaCorrente === 'clienti') this.elaboraClienti();
    else if (this.vistaCorrente === 'cantieri') this.elaboraCantieri();
    else if (this.vistaCorrente === 'commesse') this.elaboraCommesse();
    else this.elaboraAppuntamenti();
  }

  private ordinaLista(lista: any[], campo: string, direzione: 'asc' | 'desc') {
    return lista.sort((a, b) => {
      const getVal = (obj: any, path: string) => path.split('.').reduce((o, k) => (o || {})[k], obj);
      const valA = getVal(a, campo);
      const valB = getVal(b, campo);
      if (typeof valA === 'number' && typeof valB === 'number') {
        return direzione === 'asc' ? valA - valB : valB - valA;
      }
      const strA = (valA || '').toString().toLowerCase();
      const strB = (valB || '').toString().toLowerCase();
      return direzione === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }

  elaboraClienti() {
    let dati = [...this.tuttiClienti];
    const term = this.ricerca.toLowerCase();
    if (term) {
      dati = dati.filter(c => c.nome.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term));
    }
    this.clientiVisualizzati = this.ordinaLista(dati, this.settingsClienti.orderBy, this.settingsClienti.orderDirection);
  }

  elaboraCantieri() {
    let dati = [...this.tuttiCantieri];
    const term = this.ricerca.toLowerCase();

    if (term) {
      dati = dati.filter(i => i.via.toLowerCase().includes(term) || i.citta.toLowerCase().includes(term) || i.cliente?.nome.toLowerCase().includes(term));
    }

    dati = this.ordinaLista(dati, this.settingsCantieri.orderBy, this.settingsCantieri.orderDirection);

    if (this.settingsCantieri.groupBy) {
      this.isCantieriGrouped = true;
      const field = this.settingsCantieri.groupBy;
      const gruppi: { [key: string]: Indirizzo[] } = {};

      dati.forEach((item) => {
        let key = 'Altro';
        if (field === 'cliente') key = item.cliente?.nome || 'Nessun Cliente';
        else key = (item as any)[field] || 'Altro';
        key = key.toString().toUpperCase();

        if (!gruppi[key]) gruppi[key] = [];
        gruppi[key].push(item);
      });

      this.cantieriGruppi = Object.keys(gruppi).sort().map(key => ({ nome: key, items: gruppi[key] }));
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
      // Ricerca Flessibile
      dati = dati.filter(c => 
        c.seriale.toLowerCase().includes(term) || 
        c.descrizione?.toLowerCase().includes(term) || 
        c.indirizzo?.cliente?.nome.toLowerCase().includes(term) ||
        c.cliente?.nome.toLowerCase().includes(term)
      );
    }

    dati = this.ordinaLista(dati, this.settingsCommesse.orderBy, this.settingsCommesse.orderDirection);

    if (this.settingsCommesse.groupBy) {
      this.isCommesseGrouped = true;
      const field = this.settingsCommesse.groupBy;
      const gruppi: { [key: string]: Commessa[] } = {};

      dati.forEach((item) => {
        let key = 'Altro';
        switch (field) {
          case 'stato': key = item.stato; break;
          case 'cantiere': key = item.indirizzo ? `${item.indirizzo.citta}, ${item.indirizzo.via}` : 'Nessun Cantiere'; break;
          case 'cliente': key = item.cliente?.nome || item.indirizzo?.cliente?.nome || 'Nessun Cliente'; break;
          default: key = (item as any)[field] || 'Altro';
        }

        if (!gruppi[key]) gruppi[key] = [];
        gruppi[key].push(item);
      });

      this.commesseGruppi = Object.keys(gruppi).sort().map(key => ({ nome: key, items: gruppi[key] }));
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

    if (term) {
      // Ricerca Flessibile Assoluta
      dati = dati.filter(a => 
        a.nome.toLowerCase().includes(term) || 
        a.cliente?.nome.toLowerCase().includes(term) ||
        a.indirizzo?.cliente?.nome.toLowerCase().includes(term) ||
        a.commessa?.cliente?.nome.toLowerCase().includes(term) ||
        a.commessa?.indirizzo?.cliente?.nome.toLowerCase().includes(term)
      );
    }

    dati = this.ordinaLista(dati, this.settingsAppuntamenti.orderBy, this.settingsAppuntamenti.orderDirection);

    if (this.settingsAppuntamenti.groupBy) {
      this.isAppuntamentiGrouped = true;
      const field = this.settingsAppuntamenti.groupBy;
      const gruppiMap = new Map<string, Appuntamento[]>();

      dati.forEach((app) => {
        let key = 'Altro';
        const dataObj = new Date(app.data_ora);

        switch (field) {
          case 'giorno': key = dataObj.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); break;
          case 'settimana': 
            const onejan = new Date(dataObj.getFullYear(), 0, 1);
            const week = Math.ceil((((dataObj.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
            key = `Settimana ${week} - ${dataObj.getFullYear()}`; 
            break;
          case 'mese': key = dataObj.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }); break;
          case 'anno': key = dataObj.getFullYear().toString(); break;
          case 'commessa': key = app.commessa ? `${app.commessa.seriale} ${app.commessa.descrizione || ''}` : 'Nessuna Commessa'; break;
          case 'cantiere': key = app.indirizzo ? `${app.indirizzo.citta}` : (app.commessa?.indirizzo ? `${app.commessa.indirizzo.citta}` : 'Nessun Cantiere'); break;
          case 'cliente': key = app.cliente?.nome || app.indirizzo?.cliente?.nome || app.commessa?.cliente?.nome || app.commessa?.indirizzo?.cliente?.nome || 'Nessun Cliente'; break;
        }

        key = key.charAt(0).toUpperCase() + key.slice(1);
        if (!gruppiMap.has(key)) gruppiMap.set(key, []);
        gruppiMap.get(key)!.push(app);
      });

      this.appuntamentiGruppi = Array.from(gruppiMap.keys()).map(k => ({ nome: k, items: gruppiMap.get(k)! }));
      this.appuntamentiLista = [];
    } else {
      this.isAppuntamentiGrouped = false;
      this.appuntamentiLista = dati;
      this.appuntamentiGruppi = [];
    }
  }

  async apriImpostazioni(ev: any) {
    let currentSettings;
    if (this.vistaCorrente === 'clienti') currentSettings = this.settingsClienti;
    else if (this.vistaCorrente === 'cantieri') currentSettings = this.settingsCantieri;
    else if (this.vistaCorrente === 'commesse') currentSettings = this.settingsCommesse;
    else currentSettings = this.settingsAppuntamenti;

    const popover = await this.popoverCtrl.create({
      component: ListSettingsPopoverComponent, event: ev,
      componentProps: { type: this.vistaCorrente, settings: { ...currentSettings } },
    });
    await popover.present();
    const { data } = await popover.onWillDismiss();

    if (data) {
      if (this.vistaCorrente === 'clienti') { this.settingsClienti = data; this.preferencesService.saveSettings('settings_clienti', data); }
      else if (this.vistaCorrente === 'cantieri') { this.settingsCantieri = data; this.preferencesService.saveSettings('settings_cantieri', data); }
      else if (this.vistaCorrente === 'commesse') { this.settingsCommesse = data; this.preferencesService.saveSettings('settings_commesse', data); }
      else { this.settingsAppuntamenti = data; this.preferencesService.saveSettings('settings_appuntamenti', data); }
      this.elaboraDati();
    }
  }

  async apriNuovoCliente() { const m = await this.modalCtrl.create({ component: NuovoClienteModalComponent }); await m.present(); const { data } = await m.onWillDismiss(); if (data && data.creato) this.caricaDati(); }
  async apriNuovoCantiere() { const m = await this.modalCtrl.create({ component: NuovoCantiereGlobaleModalComponent }); await m.present(); const { data } = await m.onWillDismiss(); if (data && data.creato) this.caricaDati(); }
  async apriNuovaCommessa() { const m = await this.modalCtrl.create({ component: NuovaCommessaGlobaleModalComponent }); await m.present(); const { data } = await m.onWillDismiss(); if (data && data.creato) this.caricaDati(); }
  async apriNuovoAppuntamento() { const m = await this.modalCtrl.create({ component: NuovoAppuntamentoGlobaleModalComponent }); await m.present(); const { data } = await m.onWillDismiss(); if (data && data.creato) this.caricaDati(); }

  getColoreStato(stato: string): string {
    switch (stato) { case 'APERTA': return 'success'; case 'IN_CORSO': return 'warning'; case 'CHIUSA': return 'medium'; default: return 'primary'; }
  }

  getPlaceholder(): string {
    switch (this.vistaCorrente) { case 'clienti': return 'Cerca cliente...'; case 'cantieri': return 'Cerca cantiere...'; case 'commesse': return 'Cerca commessa...'; case 'appuntamenti': return 'Cerca appuntamento...'; default: return 'Cerca...'; }
  }

  // --- LOGICA DI NAVIGAZIONE POTENZIATA PER IL GRAFO FLESSIBILE ---
  async goToDettaglioElemento(item: any, tipo: 'cliente' | 'cantiere' | 'commessa' | 'appuntamento') {
    let targetClienteId = null;
    const queryParams: any = {};

    if (tipo === 'cliente') {
      targetClienteId = item.id;
    } 
    else if (tipo === 'cantiere') {
      targetClienteId = item.cliente?.id;
      queryParams.cantiereId = item.id;
    } 
    else if (tipo === 'commessa') {
      targetClienteId = item.cliente?.id || item.indirizzo?.cliente?.id;
      if (item.indirizzo) queryParams.cantiereId = item.indirizzo.id;
      queryParams.commessaId = item.id;
    } 
    else if (tipo === 'appuntamento') {
      targetClienteId = item.cliente?.id || item.indirizzo?.cliente?.id || item.commessa?.cliente?.id || item.commessa?.indirizzo?.cliente?.id;
      if (item.indirizzo) queryParams.cantiereId = item.indirizzo.id;
      if (item.commessa?.indirizzo) queryParams.cantiereId = item.commessa.indirizzo.id;
      if (item.commessa) queryParams.commessaId = item.commessa.id;
      queryParams.appuntamentoId = item.id;
    }

    if (targetClienteId) {
      // Trovato il proprietario! Naviga al dettaglio cliente.
      this.router.navigate(['/cliente-dettaglio', targetClienteId], { queryParams });
    } else {
      // Elemento totalmente slegato (orfano) -> Apri modale di modifica
      let componentToOpen: any;
      let propsToPass: any = {};

      if (tipo === 'appuntamento') {
        componentToOpen = NuovoAppuntamentoGlobaleModalComponent;
        propsToPass = { appuntamento: item };
      } else if (tipo === 'commessa') {
        this.toastCtrl.create({ message: 'Questa è una Commessa Interna', duration: 2000, color: 'primary' }).then(t => t.present());
        return;
      } else if (tipo === 'cantiere') {
        this.toastCtrl.create({ message: 'Questo è un Cantiere Interno', duration: 2000, color: 'primary' }).then(t => t.present());
        return;
      }

      if (componentToOpen) {
        const modal = await this.modalCtrl.create({ component: componentToOpen, componentProps: propsToPass });
        await modal.present();
        const { data } = await modal.onWillDismiss();
        if (data && (data.creato || data.aggiornato || data.eliminato)) this.caricaDati();
      }
    }
  }
}