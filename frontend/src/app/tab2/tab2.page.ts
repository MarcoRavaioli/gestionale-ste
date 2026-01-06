import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

// FullCalendar Imports
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid'; // Vista Mese
import timeGridPlugin from '@fullcalendar/timegrid'; // Vista Settimana/Giorno
import interactionPlugin from '@fullcalendar/interaction'; // Per cliccare
import itLocale from '@fullcalendar/core/locales/it'; // Lingua Italiana

import { AppuntamentoService } from '../services/appuntamento.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FullCalendarModule]
})
export class Tab2Page implements OnInit {
  
  // Configurazione del Calendario
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth', // Vista iniziale: Mese
    locale: itLocale, // Impostiamo l'italiano
    
    // Configurazione Toolbar (semplificata per mobile)
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'dayGridMonth,timeGridDay' // Mese vs Giorno (Settimana è stretta su mobile)
    },
    
    // Eventi e interazioni
    editable: false, // Per ora sola lettura
    selectable: true,
    weekends: true,
    
    // Al click su un evento
    eventClick: (info) => {
      alert('Hai cliccato: ' + info.event.title); // Poi faremo aprire una modale
    },

    // Array vuoto all'inizio
    events: [] 
  };

  constructor(private appuntamentoService: AppuntamentoService) {}

  ngOnInit() {
    this.caricaEventi();
  }

  // Ricarica ogni volta che entri nella tab (utile se hai aggiunto cose dalla home)
  ionViewWillEnter() {
    this.caricaEventi();
  }

  caricaEventi() {
    this.appuntamentoService.getAll().subscribe({
      next: (appuntamenti) => {
        // TRASFORMAZIONE DATI: Backend -> FullCalendar
        const eventiFormattati = appuntamenti.map(app => ({
          id: app.id.toString(),
          title: app.nome,      // FullCalendar vuole 'title'
          start: app.data_ora,  // FullCalendar vuole 'start' (ISO string va benissimo)
          // Possiamo aggiungere dati extra per usarli al click
          extendedProps: {
            descrizione: app.descrizione,
            cliente: app.commessa?.indirizzo?.cliente?.nome
          }
        }));

        // Aggiorniamo le opzioni del calendario
        this.calendarOptions = {
          ...this.calendarOptions,
          events: eventiFormattati
        };
      },
      error: (err) => console.error(err)
    });
  }
}