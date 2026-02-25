import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// 1. RIMOZIONE DI IonicModule E IMPORT DEI COMPONENTI STANDALONE
import {
  ToastController, LoadingController, AlertController,
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonList, IonItem, IonLabel, IonNote, IonFab, IonFabButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol,
  IonDatetime, IonDatetimeButton, IonModal, IonToggle, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonItemDivider, IonItemGroup, IonText, IonBadge
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { addIcons } from 'ionicons';
import {
  timeOutline, restaurantOutline, saveOutline, calendarOutline,
  createOutline, walletOutline, personOutline, fastFoodOutline,
  pencilOutline, closeCircleOutline, trashOutline, 
  addCircleOutline, settingsOutline, cashOutline, briefcaseOutline,
  calculatorOutline, pricetagOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    // 2. DICHIARAZIONE DEI COMPONENTI GRAFICI IONIC
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonList, IonItem, IonLabel, IonNote, IonFab, IonFabButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol,
    IonDatetime, IonDatetimeButton, IonModal, IonToggle, IonInput, IonTextarea,
    IonSelect, IonSelectOption, IonItemDivider, IonItemGroup, IonText, IonBadge
  ],
})

export class Tab5Page implements OnInit {
  isManager = false;
  user: any = null;

  // --- DATI MANAGER ---
  meseSelezionato: string;
  reportTeam: any[] = [];
  totaleSpesaAzienda = 0;
  
  // Configurazioni
  costoPasto = 5.29; 
  tariffeCollaboratori: { [id: number]: number } = {};

  // --- DATI COLLABORATORE ---
  oggi = new Date().toISOString();
  nuovoRapportino = {
    ore_lavorate: 8,
    buono_pasto: true,
    descrizione: '',
    giorno: new Date().toISOString(),
  };
  editingId: number | null = null;
  mieiRapportini: any[] = [];
  statsMese = { ore: 0, buoni: 0, giorni: 0 };
  maxDate = new Date().toISOString();

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      timeOutline, restaurantOutline, saveOutline, calendarOutline,
      createOutline, walletOutline, personOutline, fastFoodOutline,
      pencilOutline, closeCircleOutline, trashOutline, 
      addCircleOutline, settingsOutline, cashOutline, briefcaseOutline,
      calculatorOutline, pricetagOutline
    });

    const now = new Date();
    this.meseSelezionato = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const savedPasto = localStorage.getItem('costoPasto');
    if (savedPasto) this.costoPasto = parseFloat(savedPasto);
  }

  ngOnInit() {
    this.auth.currentUser$.subscribe((u) => {
      this.user = u;
      this.isManager = this.auth.hasManagerAccess();
      this.caricaDati();
    });
  }

  ionViewWillEnter() {
    this.caricaDati();
  }

  caricaDati() {
    if (this.isManager) {
      this.caricaReportManager();
    } else {
      this.caricaMieiDati();
    }
  }

  // ================= MANAGER LOGIC =================

  caricaReportManager() {
    const [anno, mese] = this.meseSelezionato.split('-');
    this.http.get<any[]>(`${environment.apiUrl}/tracciamento/report?anno=${anno}&mese=${mese}`)
      .subscribe((data) => {
        this.elaboraDatiManager(data);
      });
  }

  elaboraDatiManager(data: any[]) {
    const savedRates = localStorage.getItem('tariffeCollaboratori');
    if (savedRates) this.tariffeCollaboratori = JSON.parse(savedRates);

    this.reportTeam = data.map(col => {
      // Default tariffa se non salvata
      if (!this.tariffeCollaboratori[col.id]) {
        this.tariffeCollaboratori[col.id] = 10; 
      }
      
      const tariffaOraria = this.tariffeCollaboratori[col.id];
      const costoOre = col.totaleOre * tariffaOraria;
      const costoBuoni = col.totaleBuoni * this.costoPasto;
      const giorniUnici = new Set(col.dettagli.map((d: any) => d.giorno.split('T')[0])).size;

      return {
        ...col,
        tariffaOraria: tariffaOraria,
        giorniLavorati: giorniUnici,
        // Salviamo i parziali per visualizzarli
        parzialeOre: costoOre,
        parzialeBuoni: costoBuoni,
        totaleDaPagare: costoOre + costoBuoni
      };
    });

    this.ricalcolaTotaleAzienda();
  }

  aggiornaTariffa(col: any) {
    this.tariffeCollaboratori[col.id] = col.tariffaOraria;
    localStorage.setItem('tariffeCollaboratori', JSON.stringify(this.tariffeCollaboratori));
    this.ricalcolaRiga(col);
    this.ricalcolaTotaleAzienda();
  }

  // Chiamato quando cambia il costo pasto globale
  ricalcolaTutti() {
    this.reportTeam.forEach(col => this.ricalcolaRiga(col));
    this.ricalcolaTotaleAzienda();
  }

  ricalcolaRiga(col: any) {
    col.parzialeOre = col.totaleOre * col.tariffaOraria;
    col.parzialeBuoni = col.totaleBuoni * this.costoPasto;
    col.totaleDaPagare = col.parzialeOre + col.parzialeBuoni;
  }

  ricalcolaTotaleAzienda() {
    this.totaleSpesaAzienda = this.reportTeam.reduce((acc, curr) => acc + curr.totaleDaPagare, 0);
  }

  async impostaCostoPasto() {
    const alert = await this.alertCtrl.create({
      header: 'Valore Buono Pasto',
      subHeader: 'Inserisci il valore in Euro',
      inputs: [
        {
          name: 'costo',
          type: 'number',
          value: this.costoPasto,
          placeholder: 'Es. 5.29'
        }
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Salva',
          handler: (data) => {
            if (data.costo) {
              this.costoPasto = parseFloat(data.costo);
              localStorage.setItem('costoPasto', this.costoPasto.toString());
              this.ricalcolaTutti(); // Aggiorna UI
            }
          }
        }
      ]
    });
    await alert.present();
  }

  cambiaMese(event: any) {
    this.meseSelezionato = event.detail.value;
    this.caricaReportManager();
  }

  // ================= COLLABORATORE (Invariato) =================
  // ... (Tutta la logica collaboratore resta identica, non la ripeto per brevità) ...
  caricaMieiDati() {
    this.http.get<any[]>(`${environment.apiUrl}/tracciamento/me`).subscribe((data) => {
      this.mieiRapportini = data;
      this.calcolaStatsMese();
    });
  }

  calcolaStatsMese() {
    const now = new Date();
    const meseCorrente = now.getMonth();
    const annoCorrente = now.getFullYear();

    const fil = this.mieiRapportini.filter((r) => {
      const d = new Date(r.giorno);
      return d.getMonth() === meseCorrente && d.getFullYear() === annoCorrente;
    });

    this.statsMese.ore = fil.reduce((acc, curr) => acc + curr.ore_lavorate, 0);
    this.statsMese.buoni = fil.filter((r) => r.buono_pasto).length;
    this.statsMese.giorni = new Set(fil.map(r => r.giorno.split('T')[0])).size;
  }

  isDateEnabled = (dateIsoString: string) => {
    const date = new Date(dateIsoString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (date > today) return false;

    const dateStr = dateIsoString.split('T')[0];
    const esisteGia = this.mieiRapportini.some((r) => {
      if (this.editingId && r.id === this.editingId) return false;
      return r.giorno.split('T')[0] === dateStr;
    });

    return !esisteGia;
  };

  avviaModifica(rap: any) {
    this.editingId = rap.id;
    this.nuovoRapportino = { ...rap, giorno: rap.giorno };
    document.querySelector('ion-content')?.scrollToTop(500);
    this.mostraToast('Modalità Modifica Attiva', 'warning');
  }

  annullaModifica() {
    this.editingId = null;
    this.resetForm();
  }

  resetForm() {
    this.nuovoRapportino = {
      ore_lavorate: 8,
      buono_pasto: true,
      descrizione: '',
      giorno: new Date().toISOString(),
    };
  }

  async salvaRapportino() {
    if (!this.nuovoRapportino.ore_lavorate) return;
    const loader = await this.loadingCtrl.create({ message: this.editingId ? 'Aggiornamento...' : 'Salvataggio...' });
    await loader.present();

    const payload = {
      ...this.nuovoRapportino,
      giorno: this.nuovoRapportino.giorno.split('T')[0],
    };

    const req = this.editingId 
      ? this.http.patch(`${environment.apiUrl}/tracciamento/${this.editingId}`, payload)
      : this.http.post(`${environment.apiUrl}/tracciamento`, payload);

    req.subscribe({
      next: async () => {
        await loader.dismiss();
        this.mostraToast(this.editingId ? 'Aggiornato!' : 'Salvato!', 'success');
        this.caricaMieiDati();
        if(this.editingId) this.annullaModifica();
        else this.resetForm();
      },
      error: async (err) => { // <--- CATTURA L'ERRORE 'err'
        await loader.dismiss();
        
        // GESTIONE INTELLIGENTE DELL'ERRORE
        if (err.status === 409) {
          this.mostraToast('Esiste già un rapporto in questa data!', 'danger');
        } else {
          this.mostraToast('Errore operazione: ' + (err.error?.message || 'Sconosciuto'), 'danger');
        }
      },
    });
  }

  async eliminaRapportino() {
    if (!this.editingId) return;
    const alert = await this.alertCtrl.create({
      header: 'Elimina Rapportino',
      message: 'Sei sicuro?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina', role: 'destructive',
          handler: () => this.confermaEliminazione()
        }
      ]
    });
    await alert.present();
  }

  async confermaEliminazione() {
    const loader = await this.loadingCtrl.create({ message: 'Eliminazione...' });
    await loader.present();
    this.http.delete(`${environment.apiUrl}/tracciamento/${this.editingId}`).subscribe({
      next: async () => {
        await loader.dismiss();
        this.mostraToast('Eliminato', 'success');
        this.caricaMieiDati();
        this.annullaModifica();
      },
      error: async () => { await loader.dismiss(); this.mostraToast('Errore', 'danger'); }
    });
  }

  async mostraToast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, color: color, duration: 2000 });
    t.present();
  }
}