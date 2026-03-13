import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ModalController,
  ToastController,
  AlertController,
  NavController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonInput,
} from '@ionic/angular/standalone';

import { IonicSafeString, ViewDidEnter } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from 'src/app/services/indirizzo.service';
import { CommessaService } from 'src/app/services/commessa.service';
import { AuthService } from '../../services/auth.service';
import {
  Cliente,
  Indirizzo,
  Commessa,
  Appuntamento,
} from '../../interfaces/models';

import { ClienteInfoComponent } from '../../components/cliente-info/cliente-info.component';
import {
  ChildListAccordionComponent,
  ChildListItem,
} from '../../components/child-list-accordion/child-list-accordion.component';

import { addIcons } from 'ionicons';
import {
  pencil,
  closeOutline,
  saveOutline,
  trashOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-cliente-dettaglio',
  templateUrl: './cliente-dettaglio.page.html',
  styleUrls: ['./cliente-dettaglio.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClienteInfoComponent,
    ChildListAccordionComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
  ],
})
export class ClienteDettaglioPage implements OnInit, ViewDidEnter {
  clienteId = signal<number | null>(null);
  cliente = signal<Cliente | null>(null);

  hasManagerAccess = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  originalData: Partial<Cliente> = {};

  // DATA mapped for Accordions
  cantieriItems = computed<ChildListItem[]>(() => {
    const cl = this.cliente();
    if (!cl || !cl.indirizzi) return [];
    return cl.indirizzi.map((ind) => ({
      id: ind.id,
      tipo: 'cantiere',
      titolo: `${ind.via} ${ind.civico}`,
      sottotitolo: ind.citta,
      url: `/cantiere-dettaglio/${ind.id}`,
    }));
  });

  commesseDiretteItems = computed<ChildListItem[]>(() => {
    const cl = this.cliente();
    if (!cl || !cl.commesse) return [];
    return cl.commesse.map((com) => ({
      id: com.id,
      tipo: 'commessa',
      titolo: com.seriale,
      sottotitolo: com.descrizione,
      url: `/commessa-dettaglio/${com.id}`,
    }));
  });

  appuntamentiDirettiItems = computed<ChildListItem[]>(() => {
    const cl = this.cliente();
    if (!cl || !cl.appuntamenti) return [];
    return cl.appuntamenti.map((app) => ({
      id: app.id,
      tipo: 'appuntamento',
      titolo: app.nome,
      sottotitolo: new Date(app.data_ora).toLocaleString('it-IT'),
      url: `/appuntamento-dettaglio/${app.id}`,
    }));
  });

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
  ) {
    addIcons({
      pencil,
      closeOutline,
      saveOutline,
      trashOutline,
    });
  }

  ngOnInit() {
    this.hasManagerAccess.set(this.authService.hasManagerAccess());

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = parseInt(idParam || '', 10);

    if (isNaN(id) || !id) {
      this.toastCtrl
        .create({
          message: 'Nessun cliente associato.',
          duration: 2500,
          color: 'warning',
        })
        .then((t) => t.present());
      this.navCtrl.navigateRoot('/tabs/tab3');
      return;
    }

    this.clienteId.set(id);
    this.caricaDati();
  }

  ionViewDidEnter() {}

  caricaDati() {
    const id = this.clienteId();
    if (!id) return;

    this.clienteService.getOne(id).subscribe({
      next: (data) => {
        this.cliente.set(data);
      },
      error: (err) => console.error(err),
    });
  }

  abilitaModifica() {
    this.originalData = { ...this.cliente()! };
    this.isEditing.set(true);
  }

  annullaModifica() {
    const c = this.cliente()!;
    c.nome = this.originalData.nome!;
    c.email = this.originalData.email;
    c.telefono = this.originalData.telefono;
    this.cliente.set(c);
    this.isEditing.set(false);
  }

  salvaModifica() {
    const c = this.cliente()!;
    this.clienteService
      .update(c.id, {
        nome: c.nome,
        email: c.email,
        telefono: c.telefono,
      })
      .subscribe({
        next: () => {
          this.isEditing.set(false);
          this.showToast('Contatti aggiornati!');
        },
        error: () => this.showToast('Errore salvataggio'),
      });
  }

  async chiediConfermaCancellazione() {
    const alert = await this.alertCtrl.create({
      header: 'Attenzione!',
      subHeader: 'Cancellazione Cliente',
      message: new IonicSafeString(
        `Stai per eliminare <strong>${this.cliente()!.nome}</strong>.<br>Seleziona l'opzione per eliminare anche tutte le entità figlie.`,
      ),
      inputs: [
        {
          name: 'cascade',
          type: 'checkbox',
          label: 'Elimina anche tutte le entità figlie',
          value: 'cascade',
        },
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: (data) => {
            const cascade = data && data.includes('cascade');
            this.clienteService.delete(this.clienteId()!, cascade).subscribe({
              next: () => {
                this.showToast('Cliente eliminato');
                this.navCtrl.navigateBack('/tabs/tab3');
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async showToast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2000 });
    t.present();
  }
}
