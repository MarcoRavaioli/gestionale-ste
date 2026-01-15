import { Component, OnInit } from '@angular/core';
import {
  IonicModule,
  ModalController,
  ToastController, // <--- AGGIUNGI
  Platform,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppuntamentoService } from '../services/appuntamento.service';
import { AuthService } from '../services/auth.service'; // Per sapere se è admin
import { Appuntamento } from '../interfaces/models';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { NuovoAppuntamentoGlobaleModalComponent } from '../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
  chevronDownOutline,
  chevronUpOutline,
  calendarOutline,
  timeOutline,
  locationOutline,
  personOutline,
  add,
  documentsOutline,
  gridOutline,
  calendarNumberOutline,
  todayOutline,
  shareSocialOutline,
  downloadOutline,
} from 'ionicons/icons';

import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { it } from 'date-fns/locale';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class Tab2Page implements OnInit {
  // STATO CALENDARIO
  viewMode: 'week' | 'month' = 'week';
  giorniMese: Date[] = [];
  dataCorrente: Date = new Date();
  giornoSelezionato: Date = new Date();
  giorniSettimana: Date[] = [];

  isExportModalOpen = false;
  exportDateStart: string = new Date().toISOString();
  exportDateEnd: string = new Date().toISOString();

  // DATI
  tuttiAppuntamenti: Appuntamento[] = [];
  appuntamentiDelGiorno: Appuntamento[] = [];

  // STATO UI
  isAdmin: boolean = false;
  expandedAppointmentId: number | null = null; // Traccia quale card è aperta

  constructor(
    private appService: AppuntamentoService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private platform: Platform
  ) {
    addIcons({
      chevronBackOutline,
      chevronForwardOutline,
      chevronDownOutline,
      chevronUpOutline,
      calendarOutline,
      timeOutline,
      locationOutline,
      personOutline,
      documentsOutline,
      add,
      gridOutline,
      calendarNumberOutline,
      todayOutline,
      shareSocialOutline,
      downloadOutline,
    });
  }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin;
    this.generaSettimana();
  }

  ionViewWillEnter() {
    this.caricaDati();
  }

  caricaDati() {
    this.appService.getAll().subscribe((res) => {
      this.tuttiAppuntamenti = res;
      this.filtraAppuntamentiGiorno();
    });
  }

  // --- LOGICA CALENDARIO ---
  generaMese() {
    // Calcoliamo l'inizio e la fine della griglia (che deve includere i giorni "cuscinetto" del mese prima/dopo per riempire le righe)
    const start = startOfWeek(startOfMonth(this.dataCorrente), {
      weekStartsOn: 1,
    });
    const end = endOfWeek(endOfMonth(this.dataCorrente), { weekStartsOn: 1 });

    this.giorniMese = eachDayOfInterval({ start, end });
  }

  generaSettimana() {
    const start = startOfWeek(this.dataCorrente, { weekStartsOn: 1 }); // Lunedì
    const end = endOfWeek(this.dataCorrente, { weekStartsOn: 1 });
    this.giorniSettimana = eachDayOfInterval({ start, end });
  }

  settimanaPrecedente() {
    this.dataCorrente = subWeeks(this.dataCorrente, 1);
    this.generaSettimana();
  }

  settimanaSuccessiva() {
    this.dataCorrente = addWeeks(this.dataCorrente, 1);
    this.generaSettimana();
  }

  vaiAOggi() {
    this.dataCorrente = new Date(); // Torna alla data odierna
    this.giornoSelezionato = new Date(); // Seleziona oggi

    if (this.viewMode === 'week') {
      this.generaSettimana();
    } else {
      this.generaMese();
    }

    this.filtraAppuntamentiGiorno(); // Aggiorna la lista sotto
  }

  selezionaGiorno(giorno: Date) {
    this.giornoSelezionato = giorno;
    this.dataCorrente = giorno; // Aggiorna anche il puntatore corrente
    this.filtraAppuntamentiGiorno();
    this.expandedAppointmentId = null;

    // UX: Se sono in modalità mese e clicco un giorno, torno alla settimana?
    // Di solito sì, per dare spazio alla lista.
    if (this.viewMode === 'month') {
      this.viewMode = 'week';
      this.generaSettimana();
    }
  }

  filtraAppuntamentiGiorno() {
    this.appuntamentiDelGiorno = this.tuttiAppuntamenti.filter((app) => {
      return isSameDay(new Date(app.data_ora), this.giornoSelezionato);
    });
    // Ordina per orario
    this.appuntamentiDelGiorno.sort(
      (a, b) => new Date(a.data_ora).getTime() - new Date(b.data_ora).getTime()
    );
  }

  // --- GESTIONE CARD ---
  toggleDettagli(id: number) {
    if (this.expandedAppointmentId === id) {
      this.expandedAppointmentId = null; // Chiudi se già aperto
    } else {
      this.expandedAppointmentId = id; // Apri questo
    }
  }

  toggleVista() {
    if (this.viewMode === 'week') {
      this.viewMode = 'month';
      this.generaMese(); // Genera i dati solo se serve
    } else {
      this.viewMode = 'week';
      this.generaSettimana(); // Torna alla striscia
    }
  }

  // --- UTILS HTML ---
  getHeaderTitle(): string {
    return format(this.dataCorrente, 'MMMM yyyy', { locale: it });
  }

  getNomeGiorno(giorno: Date): string {
    return format(giorno, 'EEE', { locale: it }).toUpperCase();
  }

  getNumeroGiorno(giorno: Date): string {
    return format(giorno, 'd');
  }

  isSelected(giorno: Date): boolean {
    return isSameDay(giorno, this.giornoSelezionato);
  }

  isTodayCheck(giorno: Date): boolean {
    return isToday(giorno);
  }

  hasEvents(giorno: Date): boolean {
    return this.tuttiAppuntamenti.some((app) =>
      isSameDay(new Date(app.data_ora), giorno)
    );
  }

  // --- MODALE ---
  async apriNuovoAppuntamento() {
    // Calcoliamo la data di default basata sul giorno selezionato
    // Usiamo il giorno selezionato ma l'ora attuale (perché se pianifico oggi, lo faccio per adesso o più tardi)
    const now = new Date();
    const defaultDate = new Date(this.giornoSelezionato);
    defaultDate.setHours(now.getHours(), now.getMinutes(), 0, 0);

    // Convertiamo in stringa ISO locale per il campo datetime-local (YYYY-MM-DDTHH:mm)
    const localIso = new Date(
      defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);

    const modal = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
      componentProps: {
        dataIniziale: localIso, // PASSAGGIO PARAMETRO
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) this.caricaDati();
  }

  cambiaMeseSelezionato(ev: any) {
    const nuovaDataISO = ev.detail.value;
    if (nuovaDataISO) {
      // Aggiorna la data corrente al mese selezionato
      this.dataCorrente = new Date(nuovaDataISO);

      // Resetta la selezione al primo giorno del nuovo mese (o mantieni lo stesso giorno se preferisci)
      this.giornoSelezionato = new Date(this.dataCorrente);

      // Rigenera la striscia settimanale
      this.generaSettimana();

      // Ricarica gli appuntamenti
      this.filtraAppuntamentiGiorno();

      // Chiudi la modale (opzionale, ion-modal col breakpoint si chiude trascinando,
      // ma possiamo chiuderla programmaticamente se vuoi)
      this.modalCtrl.dismiss();
    }
  }
  setExportModal(open: boolean) {
    this.isExportModalOpen = open;
    // Reset date quando apro: default oggi -> tra una settimana
    if (open) {
      const now = new Date();
      this.exportDateStart = now.toISOString();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      this.exportDateEnd = nextWeek.toISOString();
    }
  }

  async esportaAppuntamenti(azione: 'share' | 'download') {
    const start = new Date(this.exportDateStart);
    const end = new Date(this.exportDateEnd);

    // 1. Filtra Appuntamenti
    const appuntamentiDaEsportare = this.tuttiAppuntamenti.filter((app) => {
      const dataApp = new Date(app.data_ora);
      return dataApp >= start && dataApp <= end;
    });

    if (appuntamentiDaEsportare.length === 0) {
      this.mostraToast('Nessun appuntamento in questo periodo.', 'warning');
      return;
    }

    // 2. Genera Contenuto .ICS
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GestioneCantieri//App//IT
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    appuntamentiDaEsportare.forEach((app) => {
      const startDate = new Date(app.data_ora);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const now = new Date();
      // Helper formattazione ISO pulita
      const formatICS = (d: Date) =>
        d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      icsContent += `BEGIN:VEVENT
UID:${app.id}@gestionecantieri.app
DTSTAMP:${formatICS(now)}
DTSTART:${formatICS(startDate)}
DTEND:${formatICS(endDate)}
SUMMARY:${app.nome}
DESCRIPTION:${app.descrizione || ''} - Commessa: ${
        app.commessa?.seriale || 'N/A'
      }
LOCATION:${app.commessa?.indirizzo?.via || ''}, ${
        app.commessa?.indirizzo?.citta || ''
      }
STATUS:CONFIRMED
END:VEVENT
`;
    });

    icsContent += `END:VCALENDAR`;

    // 3. Esegui Azione (Share o Download)
    const fileName = `calendario_${format(start, 'yyyyMMdd')}_${format(
      end,
      'yyyyMMdd'
    )}.ics`;

    try {
      if (azione === 'share') {
        // --- LOGICA CONDIVISIONE (Cache) ---
        const result = await Filesystem.writeFile({
          path: fileName,
          data: icsContent,
          directory: Directory.Cache, // Cache per condivisione temporanea
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: 'Esporta Calendario',
          url: result.uri,
          dialogTitle: 'Condividi file .ics',
        });
      } else {
        // --- LOGICA DOWNLOAD (Documents) ---

        // Se siamo su Web (Browser PC), usiamo un trucco per scaricare il file
        if (!this.platform.is('hybrid')) {
          this.downloadWeb(icsContent, fileName);
          return;
        }

        // Se siamo su Mobile (App), salviamo in Documenti
        const result = await Filesystem.writeFile({
          path: fileName,
          data: icsContent,
          directory: Directory.Documents, // Cartella persistente
          encoding: Encoding.UTF8,
        });

        this.mostraToast(`File salvato in Documenti: ${fileName}`, 'success');
      }

      this.setExportModal(false);
    } catch (e) {
      console.error('Errore operazione file', e);
      this.mostraToast('Errore durante il salvataggio/condivisione.', 'danger');
    }
  }

  async mostraToast(messaggio: string, colore: string) {
    const toast = await this.toastCtrl.create({
      message: messaggio,
      duration: 3000,
      color: colore,
      position: 'bottom',
    });
    toast.present();
  }

  // Helper per scaricare da Browser (PC)
  downloadWeb(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    this.mostraToast('Download avviato', 'success');
  }
}
