import { Component, Input, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// ... other imports ...
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  ModalController,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { CollaboratoreService } from '../../services/collaboratore.service';
import { addIcons } from 'ionicons';
import {
  personAddOutline,
  closeOutline,
  saveOutline,
  eyeOutline,
  eyeOffOutline,
  pencilOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-collaboratore-modal',
  templateUrl: './nuovo-collaboratore-modal.component.html',
  styleUrls: ['./nuovo-collaboratore-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
  ],
})
export class NuovoCollaboratoreModalComponent implements OnInit {
  @Input() collaboratore: any; // Se passato, siamo in modalità EDIT

  nuovoUtente = {
    nome: '',
    cognome: '',
    nickname: '',
    password: '',
    telefono: '',
    email: '',
    ruolo: 'COLLABORATORE', // Default
  };

  isEditMode = false;
  showPassword = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private modalCtrl: ModalController,
    private collabService: CollaboratoreService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
  ) {
    addIcons({
      personAddOutline,
      closeOutline,
      saveOutline,
      eyeOutline,
      eyeOffOutline,
      pencilOutline,
    });
  }

  ngOnInit() {
    if (this.collaboratore) {
      this.isEditMode = true;
      this.nuovoUtente = {
        ...this.nuovoUtente,
        ...this.collaboratore,
        password: '', // Non pre-popoliamo la password per sicurezza
      };
    }
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  isValid(): boolean {
    // Campi obbligatori minimi
    const baseValid = !!(this.nuovoUtente.nome && this.nuovoUtente.nickname);
    // Se è nuovo, la password è obbligatoria. Se è edit, è opzionale.
    return this.isEditMode ? baseValid : baseValid && !!this.nuovoUtente.password;
  }

  async salva() {
    if (!this.isValid()) return;

    const loader = await this.loadingCtrl.create({
      message: this.isEditMode ? 'Aggiornamento utente...' : 'Creazione utente...',
    });
    await loader.present();

    // Pulizia dati
    const payload = { ...this.nuovoUtente };
    if (!payload.email) delete (payload as any).email;
    if (this.isEditMode && !payload.password) delete (payload as any).password;

    const request = this.isEditMode
      ? this.collabService.update(this.collaboratore.id, payload)
      : this.collabService.create(payload);

    request
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: async (res) => {
        await loader.dismiss();
        this.mostraToast(
          this.isEditMode ? 'Utente aggiornato!' : 'Utente creato!',
          'success',
        );
        this.modalCtrl.dismiss({ [this.isEditMode ? 'aggiornato' : 'creato']: true });
      },
      error: async (err) => {
        await loader.dismiss();
        console.error(err);
        let errorMessage = 'Errore durante l\'operazione. Riprova.';
        if (err.error?.message) {
          errorMessage = Array.isArray(err.error.message)
            ? err.error.message.join(', ')
            : err.error.message;
        }
        this.mostraToast(`Errore: ${errorMessage}`, 'danger');
      },
    });
  }

  async mostraToast(msg: string, color: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 3000,
      color: color,
    });
    t.present();
  }
}
