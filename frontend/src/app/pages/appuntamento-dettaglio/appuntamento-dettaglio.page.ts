import { Component, OnInit, signal, ViewChild } from '@angular/core';
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
  ToastController,
  AlertController,
  NavController,
} from '@ionic/angular/standalone';

import { AppuntamentoService } from '../../services/appuntamento.service';
import { AuthService } from '../../services/auth.service';
import { Appuntamento } from '../../interfaces/models';
import { GestioneAllegatiComponent } from '../../components/gestione-allegati/gestione-allegati.component';

import { addIcons } from 'ionicons';
import {
  calendarOutline,
  documentTextOutline,
  timeOutline,
  buildOutline,
  personOutline,
  mapOutline,
  locationOutline,
  pencilOutline,
  saveOutline,
  closeOutline,
  trashOutline,
  briefcaseOutline,
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
    GestioneAllegatiComponent,
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

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  constructor(
    private route: ActivatedRoute,
    private appuntamentoService: AppuntamentoService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
  ) {
    addIcons({
      calendarOutline,
      documentTextOutline,
      timeOutline,
      buildOutline,
      personOutline,
      mapOutline,
      locationOutline,
      pencilOutline,
      saveOutline,
      closeOutline,
      trashOutline,
      briefcaseOutline,
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

  abilitaModifica() {
    const app = this.appuntamento();
    if (!app) return;

    this.editDataOra.set(new Date(app.data_ora).toISOString());
    this.editDescrizione.set(app.descrizione || '');
    this.isEditing.set(true);
  }

  annullaModifica() {
    this.isEditing.set(false);
  }

  salvaModifica() {
    const app = this.appuntamento();
    if (!app || !this.editDataOra()) return;

    this.isSaving.set(true);
    const payload = {
      data_ora: new Date(this.editDataOra()).toISOString(),
      descrizione: this.editDescrizione(),
    };

    this.appuntamentoService.update(app.id, payload).subscribe({
      next: async (res) => {
        // Upload any pending files added during edit mode
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(res.id);
        }

        this.appuntamento.set({ ...app, ...payload });
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

  getParentContext(): string {
    const app = this.appuntamento();
    if (!app) return 'Dettaglio Evento';
    if (app.commessa) return `Commessa ${app.commessa.seriale}`;
    if (app.indirizzo) return `Cantiere ${app.indirizzo.via}`;
    if (app.cliente) return `Cliente ${app.cliente.nome}`;
    return 'Appuntamento Diretto';
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
