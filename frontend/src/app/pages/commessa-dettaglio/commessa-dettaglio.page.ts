import { Component, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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
import { NuovaCommessaGlobaleModalComponent } from '../../components/nuova-commessa-globale-modal/nuova-commessa-globale-modal.component';

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
  isSaving = signal<boolean>(false);

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
        url: `/tabs/tab3/cantiere-dettaglio/${com.indirizzo.id}`,
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
      url: `/tabs/tab3/appuntamento-dettaglio/${app.id}`,
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
    private router: Router,
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

  async abilitaModifica() {
    const c = this.commessa();
    if (!c) return;

    const modal = await this.modalCtrl.create({
      component: NuovaCommessaGlobaleModalComponent,
      componentProps: {
        commessa: c,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && (data.aggiornato || data.creato)) {
      this.caricaDati();
    } else if (data && data.eliminato) {
      this.navCtrl.back();
    }
  }

  vaiACliente(id: number) {
    this.router.navigate(['/tabs/tab3/cliente-dettaglio', id]);
  }

  vaiACantiere(id: number) {
    this.router.navigate(['/tabs/tab3/cantiere-dettaglio', id]);
  }

  vaiACommessa(id: number) {
    this.router.navigate(['/tabs/tab3/commessa-dettaglio', id]);
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
