import { Component, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonButton,
  IonSpinner,
  IonTextarea,
  IonInput,
  IonSelect,
  IonSelectOption,
  ToastController,
  AlertController,
  NavController,
  ModalController,
} from '@ionic/angular/standalone';

import { CommessaService } from '../../services/commessa.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { ClienteService } from '../../services/cliente.service';
import { AuthService } from '../../services/auth.service';
import {
  Commessa,
  Appuntamento,
  Indirizzo,
  Cliente,
} from '../../interfaces/models';
import { GestioneAllegatiComponent } from '../../components/gestione-allegati/gestione-allegati.component';

// Nuovi Componenti Dumb
import { CommessaInfoComponent } from '../../components/commessa-info/commessa-info.component';
import {
  ChildListAccordionComponent,
  ChildListItem,
} from '../../components/child-list-accordion/child-list-accordion.component';
import {
  BreadcrumbGrafoComponent,
  BreadcrumbItem,
} from '../../components/breadcrumb-grafo/breadcrumb-grafo.component';

import { addIcons } from 'ionicons';
import {
  pencil,
  saveOutline,
  closeOutline,
  trashOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-commessa-dettaglio',
  templateUrl: './commessa-dettaglio.page.html',
  styleUrls: ['./commessa-dettaglio.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonButton,
    IonSpinner,
    IonTextarea,
    IonInput,
    IonSelect,
    IonSelectOption,
    GestioneAllegatiComponent,
    CommessaInfoComponent,
    ChildListAccordionComponent,
    BreadcrumbGrafoComponent,
  ],
})
export class CommessaDettaglioPage implements OnInit {
  commessaId = signal<number | null>(null);
  commessa = signal<Commessa | null>(null);

  hasManagerAccess = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Dati per i selettori padre (mutazione grafo)
  cantieriDisponibili = signal<Indirizzo[]>([]);
  clientiDisponibili = signal<Cliente[]>([]);

  // Form state
  editSeriale = signal<string>('');
  editDescrizione = signal<string>('');
  editStato = signal<'APERTA' | 'CHIUSA' | 'IN_CORSO'>('APERTA');
  editValoreTotale = signal<number | null>(null);
  editIndirizzoId = signal<number | null>(null);
  editClienteId = signal<number | null>(null);

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  // COMPUTED: Breadcrumb (Fino a Cliente -> Cantiere)
  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const com = this.commessa();
    if (!com) return [];

    let items: BreadcrumbItem[] = [];

    // Se ha un Cantiere, mostriamo Cliente -> Cantiere
    if (com.indirizzo) {
      if (com.indirizzo.cliente) {
        items.push({
          label: `Cliente ${com.indirizzo.cliente.nome}`,
          url: `/tabs/tab3/cliente-dettaglio/${com.indirizzo.cliente.id}`,
        });
      }
      items.push({
        label: `Cantiere ${com.indirizzo.via}`,
        url: `/cantiere-dettaglio/${com.indirizzo.id}`,
      });
    }
    // Se è slegata dal cantiere ma legata direttamente al Cliente
    else if (com.cliente) {
      items.push({
        label: `Cliente ${com.cliente.nome}`,
        url: `/tabs/tab3/cliente-dettaglio/${com.cliente.id}`,
      });
    }

    return items;
  });

  // COMPUTED: Accordion Items
  appuntamentiItems = computed<ChildListItem[]>(() => {
    const c = this.commessa();
    if (!c || !c.appuntamenti) return [];
    return c.appuntamenti.map((app) => ({
      id: app.id,
      tipo: 'appuntamento',
      titolo: app.nome,
      sottotitolo: new Date(app.data_ora).toLocaleString('it-IT'),
      url: `/appuntamento-dettaglio/${app.id}`,
    }));
  });

  constructor(
    private route: ActivatedRoute,
    private commessaService: CommessaService,
    private indirizzoService: IndirizzoService,
    private clienteService: ClienteService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
  ) {
    addIcons({
      pencil,
      saveOutline,
      closeOutline,
      trashOutline,
    });
  }

  ngOnInit() {
    this.hasManagerAccess.set(this.authService.hasManagerAccess());
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = parseInt(idParam || '', 10);

    if (isNaN(id) || !id) {
      this.navCtrl.back();
      return;
    }

    this.commessaId.set(id);
    this.caricaDati();
  }

  caricaDati() {
    const id = this.commessaId();
    if (!id) return;

    this.commessaService.getOne(id).subscribe({
      next: (data) => this.commessa.set(data),
      error: () =>
        this.mostraToast('Impossibile caricare la commessa', 'danger'),
    });
  }

  caricaDatiGenitore() {
    this.indirizzoService.getAll().subscribe({
      next: (res: any) => {
        const cantieri = Array.isArray(res) ? res : res.data || [];
        this.cantieriDisponibili.set(cantieri);
      },
      error: () => console.error('Errore cantieri'),
    });

    this.clienteService.getAll().subscribe({
      next: (res: any) => {
        const clienti = Array.isArray(res) ? res : res.data || [];
        this.clientiDisponibili.set(clienti);
      },
      error: () => console.error('Errore clienti'),
    });
  }

  abilitaModifica() {
    const c = this.commessa();
    if (!c) return;

    this.editSeriale.set(c.seriale);
    this.editDescrizione.set(c.descrizione || '');
    this.editStato.set(c.stato);
    this.editValoreTotale.set(c.valore_totale || null);

    this.editIndirizzoId.set(c.indirizzo ? c.indirizzo.id : null);
    this.editClienteId.set(c.cliente ? c.cliente.id : null);

    this.caricaDatiGenitore();
    this.isEditing.set(true);
  }

  annullaModifica() {
    this.isEditing.set(false);
  }

  // Regola di business: o ha un indirizzoId (cantiere), o ha un clienteId (diretta), o nessuno dei due (orfana). Evitiamo doppioni.
  onChangeCantiere(val: any) {
    this.editIndirizzoId.set(val);
    if (val) this.editClienteId.set(null); // Se scelgo un cantiere, tolgo il cliente diretto
  }

  onChangeCliente(val: any) {
    this.editClienteId.set(val);
    if (val) this.editIndirizzoId.set(null); // Se scelgo un cliente, tolgo il cantiere
  }

  salvaModifica() {
    const c = this.commessa();
    if (!c || !this.editSeriale()) return;

    this.isSaving.set(true);
    const payload = {
      seriale: this.editSeriale(),
      descrizione: this.editDescrizione(),
      stato: this.editStato(),
      valore_totale: this.editValoreTotale() ?? undefined,
      indirizzoId: this.editIndirizzoId(),
      clienteId: this.editClienteId(),
    };

    this.commessaService.update(c.id, payload).subscribe({
      next: async (res) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(res.id);
        }

        this.caricaDati(); // refresh full to get joined entities back
        this.isEditing.set(false);
        this.isSaving.set(false);
        this.mostraToast('Modifiche salvate!', 'success');
      },
      error: () => {
        this.isSaving.set(false);
        this.mostraToast('Errore nel salvataggio.', 'danger');
      },
    });
  }

  async elimina() {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Commessa',
      message:
        'Sei sicuro di voler eliminare questa commessa in modo definitivo?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Rimuovi Solo Commessa',
          role: 'destructive',
          handler: () => this.eseguiEliminazione(false),
        },
        {
          text: 'Eliminazione a cascata (Tutto)',
          role: 'destructive',
          handler: () => this.eseguiEliminazione(true),
        },
      ],
    });
    await alert.present();
  }

  eseguiEliminazione(cascade: boolean) {
    this.commessaService.delete(this.commessaId()!, cascade).subscribe({
      next: () => {
        this.mostraToast('Eliminato con successo', 'success');
        this.navCtrl.back();
      },
      error: () => this.mostraToast("Errore durante l'eliminazione", 'danger'),
    });
  }

  async mostraToast(msg: string, color: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      color,
      duration: 2500,
    });
    t.present();
  }
}
