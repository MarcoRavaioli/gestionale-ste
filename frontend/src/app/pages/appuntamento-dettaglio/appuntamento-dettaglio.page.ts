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
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonSelect,
  IonSelectOption,
  ToastController,
  AlertController,
  NavController,
} from '@ionic/angular/standalone';

import { AppuntamentoService } from '../../services/appuntamento.service';
import { CommessaService } from '../../services/commessa.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { ClienteService } from '../../services/cliente.service';
import { AuthService } from '../../services/auth.service';
import {
  Appuntamento,
  Commessa,
  Indirizzo,
  Cliente,
} from '../../interfaces/models';
import { GestioneAllegatiComponent } from '../../components/gestione-allegati/gestione-allegati.component';

// Nuovi Componenti Dumb
import { AppuntamentoInfoComponent } from '../../components/appuntamento-info/appuntamento-info.component';
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
  selector: 'app-appuntamento-dettaglio',
  templateUrl: './appuntamento-dettaglio.page.html',
  styleUrls: ['./appuntamento-dettaglio.page.scss'],
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
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonSelect,
    IonSelectOption,
    GestioneAllegatiComponent,
    AppuntamentoInfoComponent,
    BreadcrumbGrafoComponent,
  ],
})
export class AppuntamentoDettaglioPage implements OnInit {
  appuntamentoId = signal<number | null>(null);
  appuntamento = signal<Appuntamento | null>(null);

  hasManagerAccess = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Form state signals for editing
  editDataOra = signal<string>('');
  editDescrizione = signal<string>('');
  editCommessaId = signal<number | null>(null);
  editIndirizzoId = signal<number | null>(null);
  editClienteId = signal<number | null>(null);

  // Lists for dropdowns
  commesseDisponibili = signal<Commessa[]>([]);
  cantieriDisponibili = signal<Indirizzo[]>([]);
  clientiDisponibili = signal<Cliente[]>([]);

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  // COMPUTED: Breadcrumb (Fino a Cliente -> Cantiere -> Commessa)
  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const app = this.appuntamento();
    if (!app) return [];

    let items: BreadcrumbItem[] = [];

    // Priorità gerarchica inversa
    if (app.commessa) {
      const c = app.commessa;
      if (c.indirizzo) {
        if (c.indirizzo.cliente)
          items.push({
            label: `Cliente ${c.indirizzo.cliente.nome}`,
            url: `/tabs/tab3/cliente-dettaglio/${c.indirizzo.cliente.id}`,
          });
        items.push({
          label: `Cantiere ${c.indirizzo.via}`,
          url: `/cantiere-dettaglio/${c.indirizzo.id}`,
        });
      } else if (c.cliente) {
        items.push({
          label: `Cliente ${c.cliente.nome}`,
          url: `/tabs/tab3/cliente-dettaglio/${c.cliente.id}`,
        });
      }
      items.push({
        label: `Commessa ${c.seriale}`,
        url: `/commessa-dettaglio/${c.id}`,
      });
    } else if (app.indirizzo) {
      const ind = app.indirizzo;
      if (ind.cliente)
        items.push({
          label: `Cliente ${ind.cliente.nome}`,
          url: `/tabs/tab3/cliente-dettaglio/${ind.cliente.id}`,
        });
      items.push({
        label: `Cantiere ${ind.via}`,
        url: `/cantiere-dettaglio/${ind.id}`,
      });
    } else if (app.cliente) {
      items.push({
        label: `Cliente ${app.cliente.nome}`,
        url: `/tabs/tab3/cliente-dettaglio/${app.cliente.id}`,
      });
    }

    return items;
  });

  constructor(
    private route: ActivatedRoute,
    private appuntamentoService: AppuntamentoService,
    private commessaService: CommessaService,
    private indirizzoService: IndirizzoService,
    private clienteService: ClienteService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
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

    this.appuntamentoId.set(id);
    this.caricaDati();
  }

  caricaDati() {
    const id = this.appuntamentoId();
    if (!id) return;

    this.appuntamentoService.getOne(id).subscribe({
      next: (data) => this.appuntamento.set(data),
      error: () =>
        this.mostraToast("Impossibile caricare l'appuntamento", 'danger'),
    });
  }

  caricaDatiPadre() {
    this.commessaService.getAll().subscribe({
      next: (res: any) =>
        this.commesseDisponibili.set(Array.isArray(res) ? res : res.data || []),
    });
    this.indirizzoService.getAll().subscribe({
      next: (res: any) =>
        this.cantieriDisponibili.set(Array.isArray(res) ? res : res.data || []),
    });
    this.clienteService.getAll().subscribe({
      next: (res: any) =>
        this.clientiDisponibili.set(Array.isArray(res) ? res : res.data || []),
    });
  }

  abilitaModifica() {
    const app = this.appuntamento();
    if (!app) return;

    this.editDataOra.set(new Date(app.data_ora).toISOString());
    this.editDescrizione.set(app.descrizione || '');
    this.editCommessaId.set(app.commessa ? app.commessa.id : null);
    this.editIndirizzoId.set(app.indirizzo ? app.indirizzo.id : null);
    this.editClienteId.set(app.cliente ? app.cliente.id : null);

    this.caricaDatiPadre();
    this.isEditing.set(true);
  }

  annullaModifica() {
    this.isEditing.set(false);
  }

  // Mutually Exclusive Parent Selectors logic
  onChangeCommessa(val: any) {
    this.editCommessaId.set(val);
    if (val) {
      this.editIndirizzoId.set(null);
      this.editClienteId.set(null);
    }
  }

  onChangeCantiere(val: any) {
    this.editIndirizzoId.set(val);
    if (val) {
      this.editCommessaId.set(null);
      this.editClienteId.set(null);
    }
  }

  onChangeCliente(val: any) {
    this.editClienteId.set(val);
    if (val) {
      this.editCommessaId.set(null);
      this.editIndirizzoId.set(null);
    }
  }

  salvaModifica() {
    const app = this.appuntamento();
    if (!app || !this.editDataOra()) return;

    this.isSaving.set(true);
    const payload: any = {
      data_ora: new Date(this.editDataOra()).toISOString(),
      descrizione: this.editDescrizione(),
      commessaId: this.editCommessaId() ?? undefined,
      indirizzoId: this.editIndirizzoId() ?? undefined,
      clienteId: this.editClienteId() ?? undefined,
    };

    this.appuntamentoService.update(app.id, payload).subscribe({
      next: async (res) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(res.id);
        }

        this.caricaDati(); // refresh full hierarchy
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
      header: 'Elimina Appuntamento',
      message:
        'Sei sicuro di voler eliminare questo appuntamento in modo definitivo?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: () => {
            this.appuntamentoService.delete(this.appuntamentoId()!).subscribe({
              next: () => {
                this.mostraToast('Eliminato con successo', 'success');
                this.navCtrl.back();
              },
              error: () =>
                this.mostraToast("Errore durante l'eliminazione", 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
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
