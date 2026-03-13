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
  ToastController,
  AlertController,
  NavController,
  IonCard,
  IonFab,
  IonFabButton,
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

import {
  BreadcrumbItem,
} from '../../components/breadcrumb-grafo/breadcrumb-grafo.component';
import { NuovoAppuntamentoGlobaleModalComponent } from '../../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';
import { ModalController } from '@ionic/angular/standalone';

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
    IonCard,
    IonFab,
    IonFabButton,
    GestioneAllegatiComponent,
  ],
})
export class AppuntamentoDettaglioPage implements OnInit {
  appuntamentoId = signal<number | null>(null);
  appuntamento = signal<Appuntamento | null>(null);

  hasManagerAccess = signal<boolean>(false);
  isSaving = signal<boolean>(false);

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

  async abilitaModifica() {
    const app = this.appuntamento();
    if (!app) return;

    const modal = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
      componentProps: {
        appuntamento: app,
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
    this.router.navigate(['/cliente-dettaglio', id]);
  }

  vaiACantiere(id: number) {
    this.router.navigate(['/cantiere-dettaglio', id]);
  }

  vaiACommessa(id: number) {
    this.router.navigate(['/commessa-dettaglio', id]);
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
