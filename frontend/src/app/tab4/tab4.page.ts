import { Component, OnInit, signal, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSearchbar,
  IonList,
  IonItem,
  IonBadge,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonToggle,
  IonPopover,
} from '@ionic/angular/standalone';
import { FatturaService } from '../services/fattura.service';
import { Fattura, TipoFattura } from '../interfaces/models';
import { addIcons } from 'ionicons';
import {
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
  calendar,
  closeCircle,
  closeCircleOutline,
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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSearchbar,
    IonList,
    IonItem,
    IonBadge,
    IonFab,
    IonFabButton,
    IonRefresher,
    IonRefresherContent,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonToggle,
    IonPopover,
  ],
})
export class Tab4Page implements OnInit {
  tutteFatture = signal<Fattura[]>([]);
  gruppiFatture = signal<GruppoFatture[]>([]);
  private destroyRef = inject(DestroyRef);

  // STATO UI
  filtroCorrente = signal<'tutte' | 'entrata' | 'uscita' | 'scadute'>('tutte');
  mostraSoloIncassati = signal<boolean>(false);

  // FILTRI
  testoRicerca = signal<string>('');
  filtroDataInizio = signal<string | null>(null);
  filtroDataFine = signal<string | null>(null);

  // COMPUTED TOTALI E BILANCIO
  fattureFiltrateTemporalmente = computed(() => {
    const list = this.tutteFatture();
    const init = this.filtroDataInizio();
    const end = this.filtroDataFine();

    if (!init && !end) return list;

    return list.filter((f) => {
      const dataFattura = new Date(f.data_emissione);
      let valid = true;
      if (init) {
        const start = new Date(init);
        start.setHours(0, 0, 0, 0);
        if (dataFattura < start) valid = false;
      }
      if (end) {
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        if (dataFattura > e) valid = false;
      }
      return valid;
    });
  });

  totaleEntrate = computed(() => {
    let pool = this.fattureFiltrateTemporalmente();
    if (this.mostraSoloIncassati()) {
      pool = pool.filter((f) => f.incassata === true);
    }
    return pool
      .filter((f) => f.tipo === TipoFattura.ENTRATA)
      .reduce((acc, curr) => acc + this.parseVal(curr.totale), 0);
  });

  totaleUscite = computed(() => {
    let pool = this.fattureFiltrateTemporalmente();
    if (this.mostraSoloIncassati()) {
      pool = pool.filter((f) => f.incassata === true);
    }
    return pool
      .filter((f) => f.tipo === TipoFattura.USCITA)
      .reduce((acc, curr) => acc + this.parseVal(curr.totale), 0);
  });

  bilancio = computed(() => this.totaleEntrate() - this.totaleUscite());

  // COMPUTED GRUPPI (Reagisce ai filtri applicati)
  fattureFiltrate = computed(() => {
    let filtrati = [...this.fattureFiltrateTemporalmente()];
    const search = this.testoRicerca().trim().toLowerCase();

    if (search) {
      filtrati = filtrati.filter(
        (f) =>
          (f.cliente?.nome && f.cliente.nome.toLowerCase().includes(search)) ||
          (f.numero_fattura &&
            f.numero_fattura.toLowerCase().includes(search)) ||
          (f.commesse?.some((c) =>
            c.seriale.toLowerCase().includes(search),
          )) ||
          (f.descrizione && f.descrizione.toLowerCase().includes(search)),
      );
    }

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const filtro = this.filtroCorrente();

    switch (filtro) {
      case 'entrata':
        filtrati = filtrati.filter((f) => f.tipo === TipoFattura.ENTRATA);
        break;
      case 'uscita':
        filtrati = filtrati.filter((f) => f.tipo === TipoFattura.USCITA);
        break;
      case 'scadute':
        filtrati = filtrati.filter((f) => {
          if (f.incassata || !f.data_scadenza) return false;
          const sca = new Date(f.data_scadenza);
          sca.setHours(0, 0, 0, 0);
          return sca < oggi;
        });
        break;
    }

    // Dividiamole in Gruppi
    const daSaldare = filtrati.filter((f) => !f.incassata);
    const saldate = filtrati.filter((f) => f.incassata);
    const gruppi: GruppoFatture[] = [];

    if (daSaldare.length > 0) {
      gruppi.push({ titolo: 'DA SALDARE', fatture: daSaldare });
    }
    if (saldate.length > 0) {
      gruppi.push({ titolo: 'COMPLETATE', fatture: saldate });
    }

    return gruppi;
  });

  labelFiltroData = computed(() => {
    const init = this.filtroDataInizio();
    const end = this.filtroDataFine();

    if (init && end) {
      const d1 = new Date(init).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
      });
      const d2 = new Date(end).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
      });
      return `${d1} - ${d2}`;
    }
    return 'Periodo';
  });

  isFiltroDataAttivo = computed(
    () => !!this.filtroDataInizio() && !!this.filtroDataFine(),
  );

  constructor(
    private fatturaService: FatturaService,
    private modalCtrl: ModalController,
  ) {
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
      calendar,
      closeCircle,
      closeCircleOutline,
    });
  }

  ngOnInit() {
    this.caricaDati();
  }

  ionViewWillEnter() {
    this.caricaDati();
  }

  caricaDati(event?: any) {
    this.fatturaService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          // Ordiniamo per data di emissione decrescente
          data.sort(
            (a, b) =>
              new Date(b.data_emissione).getTime() -
              new Date(a.data_emissione).getTime(),
          );
          this.tutteFatture.set(data);
          if (event) event.target.complete();
        },
        error: () => {
          if (event) event.target.complete();
        },
      });
  }

  cambiaFiltro(ev: any) {
    this.filtroCorrente.set(ev.detail.value);
  }

  onToggleIncassatiChange(ev: any) {
    this.mostraSoloIncassati.set(ev.detail.checked);
  }

  onSearchChange(ev: any) {
    this.testoRicerca.set(ev.detail.value);
  }

  onDateChangeInizio(ev: any) {
    this.filtroDataInizio.set(ev.detail.value);
  }

  onDateChangeFine(ev: any) {
    this.filtroDataFine.set(ev.detail.value);
  }

  resetDate() {
    this.filtroDataInizio.set(null);
    this.filtroDataFine.set(null);
  }

  parseVal(val: any): number {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const parsed = Number(val.toString().replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }

  isScaduta(fattura: Fattura): boolean {
    if (fattura.incassata || !fattura.data_scadenza) return false;
    const sca = new Date(fattura.data_scadenza);
    sca.setHours(0, 0, 0, 0);
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    return sca < oggi;
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
}
