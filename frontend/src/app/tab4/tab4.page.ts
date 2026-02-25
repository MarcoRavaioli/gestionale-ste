import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// 1. RIMOZIONE DI IonicModule E IMPORT DEI COMPONENTI STANDALONE
import { 
  ModalController,
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSegment, IonSegmentButton, IonLabel, IonSearchbar,
  IonList, IonItem, IonNote, IonBadge, IonFab, IonFabButton,
  IonRefresher, IonRefresherContent, IonItemDivider, IonItemGroup,
  IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonDatetime, 
  IonDatetimeButton, IonModal, IonToggle,
  IonPopover
} from '@ionic/angular/standalone';
import { FatturaService } from '../services/fattura.service';
import { Fattura, TipoFattura } from '../interfaces/models';
import { addIcons } from 'ionicons';
import {
  arrowUpCircle, arrowDownCircle, filterOutline, add, alertCircleOutline,
  checkmarkCircleOutline, timeOutline, walletOutline, chevronDownOutline,
  searchOutline, calendarOutline, calendar, closeCircle, closeCircleOutline,
} from 'ionicons/icons';
import { NuovaFatturaModalComponent } from '../components/nuova-fattura-modal/nuova-fattura-modal.component';
import { FatturaDettaglioModalComponent } from '../components/fattura-dettaglio-modal/fattura-dettaglio-modal.component';

interface GruppoFatture {
  titolo: string;
  fatture: Fattura[];
}

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonIcon, IonSegment, IonSegmentButton, IonLabel, IonSearchbar,
    IonList, IonItem, IonBadge, IonFab, IonFabButton,
    IonRefresher, IonRefresherContent, IonDatetime, 
    IonDatetimeButton, IonModal, IonToggle, IonPopover
  ],
})

export class Tab4Page implements OnInit {
  tutteFatture: Fattura[] = [];
  gruppiFatture: GruppoFatture[] = [];

  // STATO UI
  filtroCorrente: 'tutte' | 'entrata' | 'uscita' | 'scadute' = 'tutte';
  mostraSoloIncassati: boolean = false;

  // NUOVI FILTRI
  testoRicerca: string = '';
  filtroDataInizio: string | null = null;
  filtroDataFine: string | null = null;

  // TOTALI
  totaleEntrate: number = 0;
  totaleUscite: number = 0;
  bilancio: number = 0;

  constructor(
    private fatturaService: FatturaService,
    private modalCtrl: ModalController
  ) {
    // REGISTRA LE NUOVE ICONE QUI
    addIcons({
      arrowUpCircle,
      arrowDownCircle,
      filterOutline,
      add,
      alertCircleOutline,
      checkmarkCircleOutline,
      timeOutline,
      walletOutline,
      chevronDownOutline,
      searchOutline,
      calendarOutline,
      calendar, // <--- AGGIUNTO
      closeCircle, // <--- AGGIUNTO (Fondamentale per vedere la X)
      closeCircleOutline,
    });
  }

  ngOnInit() {
    this.caricaDati();
  }

  // ... (Tutto il resto del file rimane identico a prima) ...

  ionViewWillEnter() {
    this.caricaDati();
  }

  caricaDati(event?: any) {
    this.fatturaService.getAll().subscribe({
      next: (data) => {
        this.tutteFatture = data;
        this.aggiornaTutto();
        if (event) event.target.complete();
      },
      error: () => {
        if (event) event.target.complete();
      },
    });
  }

  cambiaFiltro(ev: any) {
    this.filtroCorrente = ev.detail.value;
    this.aggiornaLista();
  }

  onToggleIncassatiChange() {
    this.calcolaTotali();
  }

  onSearchChange(ev: any) {
    this.testoRicerca = ev.detail.value;
    this.aggiornaLista();
  }

  onDateChange() {
    this.aggiornaTutto();
  }

  resetDate() {
    this.filtroDataInizio = null;
    this.filtroDataFine = null;
    this.aggiornaTutto();
  }

  aggiornaTutto() {
    this.calcolaTotali();
    this.aggiornaLista();
  }

  calcolaTotali() {
    let pool = this.applicaFiltroTemporale(this.tutteFatture);
    if (this.mostraSoloIncassati) {
      pool = pool.filter((f) => f.incassata === true);
    }
    this.totaleEntrate = pool
      .filter((f) => f.tipo === TipoFattura.ENTRATA)
      .reduce((acc, curr) => acc + Number(curr.totale), 0);
    this.totaleUscite = pool
      .filter((f) => f.tipo === TipoFattura.USCITA)
      .reduce((acc, curr) => acc + Number(curr.totale), 0);
    this.bilancio = this.totaleEntrate - this.totaleUscite;
  }

  aggiornaLista() {
    let filtrati = [...this.tutteFatture];
    filtrati = this.applicaFiltroTemporale(filtrati);

    if (this.testoRicerca && this.testoRicerca.trim() !== '') {
      const q = this.testoRicerca.toLowerCase();
      filtrati = filtrati.filter(
        (f) =>
          (f.cliente?.nome && f.cliente.nome.toLowerCase().includes(q)) ||
          (f.numero_fattura && f.numero_fattura.toLowerCase().includes(q)) ||
          (f.descrizione && f.descrizione.toLowerCase().includes(q))
      );
    }

    const oggi = new Date();
    switch (this.filtroCorrente) {
      case 'entrata':
        filtrati = filtrati.filter((f) => f.tipo === TipoFattura.ENTRATA);
        break;
      case 'uscita':
        filtrati = filtrati.filter((f) => f.tipo === TipoFattura.USCITA);
        break;
      case 'scadute':
        filtrati = filtrati.filter(
          (f) =>
            !f.incassata && f.data_scadenza && new Date(f.data_scadenza) < oggi
        );
        break;
    }
    this.creaGruppi(filtrati);
  }

  applicaFiltroTemporale(fatture: Fattura[]): Fattura[] {
    if (!this.filtroDataInizio && !this.filtroDataFine) return fatture;
    return fatture.filter((f) => {
      const dataFattura = new Date(f.data_emissione);
      let valid = true;
      if (this.filtroDataInizio) {
        const start = new Date(this.filtroDataInizio);
        start.setHours(0, 0, 0, 0);
        if (dataFattura < start) valid = false;
      }
      if (this.filtroDataFine) {
        const end = new Date(this.filtroDataFine);
        end.setHours(23, 59, 59, 999);
        if (dataFattura > end) valid = false;
      }
      return valid;
    });
  }

  creaGruppi(lista: Fattura[]) {
    const daSaldare = lista.filter((f) => !f.incassata);
    const saldate = lista.filter((f) => f.incassata);
    this.gruppiFatture = [];
    if (daSaldare.length > 0) {
      this.gruppiFatture.push({ titolo: 'DA SALDARE', fatture: daSaldare });
    }
    if (saldate.length > 0) {
      this.gruppiFatture.push({ titolo: 'COMPLETATE', fatture: saldate });
    }
  }

  isScaduta(fattura: Fattura): boolean {
    if (fattura.incassata || !fattura.data_scadenza) return false;
    return new Date(fattura.data_scadenza) < new Date();
  }

  async apriNuovaFattura() {
    const modal = await this.modalCtrl.create({
      component: NuovaFatturaModalComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) this.caricaDati();
  }

  async apriDettaglio(fattura: Fattura) {
    const modal = await this.modalCtrl.create({
      component: FatturaDettaglioModalComponent,
      componentProps: { fattura: fattura },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.eliminato || data?.aggiornato) this.caricaDati();
  }

  get labelFiltroData(): string {
    if (this.filtroDataInizio && this.filtroDataFine) {
      const d1 = new Date(this.filtroDataInizio).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
      });
      const d2 = new Date(this.filtroDataFine).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
      });
      return `${d1} - ${d2}`;
    }
    return 'Periodo';
  }

  get isFiltroDataAttivo(): boolean {
    return !!(this.filtroDataInizio && this.filtroDataFine);
  }
}
