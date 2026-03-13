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
import { NuovoCantiereGlobaleModalComponent } from '../../components/nuovo-cantiere-globale-modal/nuovo-cantiere-globale-modal.component';

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
  isSaving = signal<boolean>(false);

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
      url: `/tabs/tab3/commessa-dettaglio/${com.id}`,
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
      url: `/tabs/tab3/appuntamento-dettaglio/${app.id}`,
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

  async abilitaModifica() {
    const c = this.cantiere();
    if (!c) return;

    const modal = await this.modalCtrl.create({
      component: NuovoCantiereGlobaleModalComponent,
      componentProps: {
        cantiere: c,
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

  vaiACommessa(id: number) {
    this.router.navigate(['/commessa-dettaglio', id]);
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
