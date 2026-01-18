import { Component, OnInit } from '@angular/core';
import {
  IonicModule,
  ModalController,
  ToastController,
  Platform,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AppuntamentoService } from '../services/appuntamento.service';
import { AuthService } from '../services/auth.service';
import { Appuntamento } from '../interfaces/models';
import { environment } from 'src/environments/environment';
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
  createOutline,
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
import { Router } from '@angular/router';

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

  // NUOVO: Array per i giorni in cui il team è completo
  giorniTeamCompleti: string[] = [];

  // STATO UI
  isAdmin: boolean = false; // Solo per 'ADMIN'
  isManager: boolean = false; // Per 'ADMIN' e 'MANAGER'
  expandedAppointmentId: number | null = null;

  constructor(
    private appService: AppuntamentoService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private platform: Platform,
    private http: HttpClient,
    private router: Router
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
      createOutline,
    });
  }

  ngOnInit() {
    // --- MODIFICA: Sottoscrizione per aggiornare i permessi in tempo reale ---
    this.authService.currentUser$.subscribe((user) => {
      this.isAdmin = this.authService.isAdmin();
      this.isManager = this.authService.hasManagerAccess(); // Admin + Manager

      // Se l'utente è cambiato e ha i permessi, ricarichiamo i pallini verdi
      if (this.isManager) {
        this.caricaStatoTeam();
      }
    });

    this.generaSettimana();
  }

  ionViewWillEnter() {
    this.caricaDati();
    // Se è Manager (o Admin), carica anche lo stato del team
    if (this.isManager) {
      this.caricaStatoTeam();
    }
  }

  caricaDati() {
    this.appService.getAll().subscribe((res) => {
      this.tuttiAppuntamenti = res;
      this.filtraAppuntamentiGiorno();
    });
  }

  // --- Carica i pallini verdi dal Backend ---
  caricaStatoTeam() {
    // Evita la chiamata se non sei manager
    if (!this.isManager) return;

    const anno = this.dataCorrente.getFullYear();
    const mese = this.dataCorrente.getMonth() + 1;

    this.http
      .get<string[]>(
        `${environment.apiUrl}/tracciamento/completamento?anno=${anno}&mese=${mese}`
      )
      .subscribe({
        next: (dates) => {
          this.giorniTeamCompleti = dates;
        },
        error: (err) => console.error('Err completamento team', err),
      });
  }

  // --- Verifica per l'HTML ---
  isTeamCompleto(date: Date): boolean {
    if (!this.isManager) return false; // Usa isManager per coerenza

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return this.giorniTeamCompleti.includes(dateString);
  }

  // --- LOGICA CALENDARIO ---
  generaMese() {
    const start = startOfWeek(startOfMonth(this.dataCorrente), {
      weekStartsOn: 1,
    });
    const end = endOfWeek(endOfMonth(this.dataCorrente), { weekStartsOn: 1 });

    this.giorniMese = eachDayOfInterval({ start, end });
  }

  generaSettimana() {
    const start = startOfWeek(this.dataCorrente, { weekStartsOn: 1 });
    const end = endOfWeek(this.dataCorrente, { weekStartsOn: 1 });
    this.giorniSettimana = eachDayOfInterval({ start, end });
  }

  settimanaPrecedente() {
    this.dataCorrente = subWeeks(this.dataCorrente, 1);
    this.generaSettimana();
    if (this.isManager) this.caricaStatoTeam();
  }

  settimanaSuccessiva() {
    this.dataCorrente = addWeeks(this.dataCorrente, 1);
    this.generaSettimana();
    if (this.isManager) this.caricaStatoTeam();
  }

  vaiAOggi() {
    this.dataCorrente = new Date();
    this.giornoSelezionato = new Date();

    if (this.viewMode === 'week') {
      this.generaSettimana();
    } else {
      this.generaMese();
    }

    if (this.isManager) this.caricaStatoTeam();
    this.filtraAppuntamentiGiorno();
  }

  selezionaGiorno(giorno: Date) {
    this.giornoSelezionato = giorno;
    this.dataCorrente = giorno;
    this.filtraAppuntamentiGiorno();
    this.expandedAppointmentId = null;

    if (this.viewMode === 'month') {
      this.viewMode = 'week';
      this.generaSettimana();
    }
  }

  filtraAppuntamentiGiorno() {
    this.appuntamentiDelGiorno = this.tuttiAppuntamenti.filter((app) => {
      return isSameDay(new Date(app.data_ora), this.giornoSelezionato);
    });
    this.appuntamentiDelGiorno.sort(
      (a, b) => new Date(a.data_ora).getTime() - new Date(b.data_ora).getTime()
    );
  }

  toggleDettagli(id: number) {
    if (this.expandedAppointmentId === id) {
      this.expandedAppointmentId = null;
    } else {
      this.expandedAppointmentId = id;
    }
  }

  toggleVista() {
    if (this.viewMode === 'week') {
      this.viewMode = 'month';
      this.generaMese();
    } else {
      this.viewMode = 'week';
      this.generaSettimana();
    }
  }

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

  async apriNuovoAppuntamento() {
    const now = new Date();
    const defaultDate = new Date(this.giornoSelezionato);
    defaultDate.setHours(now.getHours(), now.getMinutes(), 0, 0);

    const localIso = new Date(
      defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);

    const modal = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
      componentProps: {
        dataIniziale: localIso,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) this.caricaDati();
  }

  cambiaMeseSelezionato(ev: any) {
    const nuovaDataISO = ev.detail.value;
    if (nuovaDataISO) {
      this.dataCorrente = new Date(nuovaDataISO);
      this.giornoSelezionato = new Date(this.dataCorrente);
      this.generaSettimana();
      this.filtraAppuntamentiGiorno();
      if (this.isManager) this.caricaStatoTeam();
      this.modalCtrl.dismiss();
    }
  }

  goToAppuntamento(app: Appuntamento) {
    if (app.commessa?.indirizzo?.cliente?.id) {
      this.router.navigate(
        ['/cliente-dettaglio', app.commessa.indirizzo.cliente.id],
        {
          queryParams: {
            cantiereId: app.commessa.indirizzo.id,
            commessaId: app.commessa.id,
            appuntamentoId: app.id,
          },
        }
      );
    } else {
      this.mostraToast('Impossibile aprire: Appuntamento non collegato a un cliente.', 'warning');
    }
  }

  setExportModal(open: boolean) {
    this.isExportModalOpen = open;
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

    const appuntamentiDaEsportare = this.tuttiAppuntamenti.filter((app) => {
      const dataApp = new Date(app.data_ora);
      return dataApp >= start && dataApp <= end;
    });

    if (appuntamentiDaEsportare.length === 0) {
      this.mostraToast('Nessun appuntamento in questo periodo.', 'warning');
      return;
    }

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

    const fileName = `calendario_${format(start, 'yyyyMMdd')}_${format(
      end,
      'yyyyMMdd'
    )}.ics`;

    try {
      if (azione === 'share') {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: icsContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: 'Esporta Calendario',
          url: result.uri,
          dialogTitle: 'Condividi file .ics',
        });
      } else {
        if (!this.platform.is('hybrid')) {
          this.downloadWeb(icsContent, fileName);
          return;
        }

        const result = await Filesystem.writeFile({
          path: fileName,
          data: icsContent,
          directory: Directory.Documents,
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
