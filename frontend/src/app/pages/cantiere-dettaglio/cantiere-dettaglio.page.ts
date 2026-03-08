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
  ToastController,
  AlertController,
  NavController,
  ModalController,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';

import { IndirizzoService } from '../../services/indirizzo.service';
import { ClienteService } from '../../services/cliente.service';
import { AuthService } from '../../services/auth.service';
import { Indirizzo, Cliente } from '../../interfaces/models';
import { GestioneAllegatiComponent } from '../../components/gestione-allegati/gestione-allegati.component';

// Nuovi Componenti Dumb
import { CantiereInfoComponent } from '../../components/cantiere-info/cantiere-info.component';
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
  selector: 'app-cantiere-dettaglio',
  templateUrl: './cantiere-dettaglio.page.html',
  styleUrls: ['./cantiere-dettaglio.page.scss'],
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
    CantiereInfoComponent,
    ChildListAccordionComponent,
    BreadcrumbGrafoComponent,
  ],
})
export class CantiereDettaglioPage implements OnInit {
  cantiereId = signal<number | null>(null);
  cantiere = signal<Indirizzo | null>(null);

  hasManagerAccess = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Per il selettore Cliente durante la modifica
  clientiDisponibili = signal<Cliente[]>([]);

  // Form state
  editVia = signal<string>('');
  editCivico = signal<string>('');
  editCitta = signal<string>('');
  editCap = signal<string>('');
  editProvincia = signal<string>('');
  editClienteId = signal<number | null>(null);

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  // COMPUTED: Breadcrumb
  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const c = this.cantiere();
    if (!c || !c.cliente) return []; // Se è orfano non mostra nulla
    return [
      {
        label: `Cliente ${c.cliente.nome}`,
        url: `/tabs/tab3/cliente-dettaglio/${c.cliente.id}`,
      },
    ];
  });

  // COMPUTED: Accordion Items
  commesseItems = computed<ChildListItem[]>(() => {
    const c = this.cantiere();
    if (!c || !c.commesse) return [];
    return c.commesse.map((com) => ({
      id: com.id,
      tipo: 'commessa',
      titolo: com.seriale,
      sottotitolo: com.descrizione,
      url: `/commessa-dettaglio/${com.id}`,
    }));
  });

  appuntamentiItems = computed<ChildListItem[]>(() => {
    const c = this.cantiere();
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

    this.cantiereId.set(id);
    this.caricaDati();
  }

  caricaDati() {
    const id = this.cantiereId();
    if (!id) return;

    this.indirizzoService.findOne(id).subscribe({
      next: (data) => this.cantiere.set(data),
      error: () =>
        this.mostraToast('Impossibile caricare il cantiere', 'danger'),
    });
  }

  caricaClientiPerSelettore() {
    this.clienteService.getAll().subscribe({
      next: (res: any) => {
        // Handle both possible API return formats
        const clienti = Array.isArray(res) ? res : res.data || [];
        this.clientiDisponibili.set(clienti);
      },
      error: () => console.error('Errore caricamento clienti'),
    });
  }

  abilitaModifica() {
    const c = this.cantiere();
    if (!c) return;

    this.editVia.set(c.via);
    this.editCivico.set(c.civico);
    this.editCitta.set(c.citta);
    this.editCap.set(c.cap);
    this.editProvincia.set(c.provincia || '');
    this.editClienteId.set(c.cliente ? c.cliente.id : null);

    this.caricaClientiPerSelettore();
    this.isEditing.set(true);
  }

  annullaModifica() {
    this.isEditing.set(false);
  }

  salvaModifica() {
    const c = this.cantiere();
    if (!c || !this.editVia() || !this.editCitta()) return;

    this.isSaving.set(true);
    const payload = {
      via: this.editVia(),
      civico: this.editCivico(),
      citta: this.editCitta(),
      cap: this.editCap(),
      provincia: this.editProvincia(),
      stato: c.stato, // preserved
      clienteId: this.editClienteId(),
    };

    this.indirizzoService.update(c.id, payload).subscribe({
      next: async (res) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(res.id);
        }

        // Ricarica tutto da server per aggiornare i genitore calcolati (per sicurezza)
        this.caricaDati();
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
      header: 'Elimina Cantiere',
      message:
        'Sei sicuro di voler eliminare questo cantiere in modo definitivo?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Rimuovi Solo Cantiere',
          role: 'destructive',
          handler: () => this.confermaEliminazione(false),
        },
        {
          text: 'Eliminazione a Cascata (Tutto)',
          role: 'destructive',
          handler: () => this.confermaEliminazione(true),
        },
      ],
    });
    await alert.present();
  }

  confermaEliminazione(cascade: boolean) {
    this.indirizzoService.delete(this.cantiereId()!, cascade).subscribe({
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
