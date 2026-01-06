import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { Cliente } from '../../interfaces/models';
import { AuthService } from '../../services/auth.service';
import { NuovoIndirizzoModalComponent } from '../../components/nuovo-indirizzo-modal/nuovo-indirizzo-modal.component';
import { NuovaCommessaModalComponent } from '../../components/nuova-commessa-modal/nuova-commessa-modal.component';

// ICONE
import { addIcons } from 'ionicons';
import { 
  locationOutline, businessOutline, walletOutline, documentTextOutline, 
  callOutline, mailOutline, pencilOutline, addCircleOutline, 
  saveOutline, closeOutline, add
} from 'ionicons/icons';

@Component({
  selector: 'app-cliente-dettaglio',
  templateUrl: './cliente-dettaglio.page.html',
  styleUrls: ['./cliente-dettaglio.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ClienteDettaglioPage implements OnInit {
  
  cliente: Cliente | null = null;
  isAdmin: boolean = false;
  isEditing: boolean = false; // Stato per la modifica inline
  
  // Backup per annullare le modifiche
  originalData: Partial<Cliente> = {};

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {
    addIcons({ 
      locationOutline, businessOutline, walletOutline, documentTextOutline, 
      callOutline, mailOutline, pencilOutline, addCircleOutline, 
      saveOutline, closeOutline, add
    });
  }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.caricaDati(+id);
  }

  caricaDati(id: number) {
    this.clienteService.getOne(id).subscribe({
      next: (data) => this.cliente = data,
      error: (err) => console.error(err)
    });
  }

  // --- LOGICA MODIFICA INLINE ---
  abilitaModifica() {
    if (!this.cliente) return;
    this.originalData = { ...this.cliente }; // Copia di backup
    this.isEditing = true;
  }

  annullaModifica() {
    if (!this.cliente) return;
    // Ripristina i dati originali
    this.cliente.email = this.originalData.email;
    this.cliente.telefono = this.originalData.telefono;
    this.isEditing = false;
  }

  salvaModifica() {
    if (!this.cliente) return;
    this.clienteService.update(this.cliente.id, {
      email: this.cliente.email,
      telefono: this.cliente.telefono
    }).subscribe({
      next: () => {
        this.isEditing = false;
        this.showToast('Contatti aggiornati!');
      },
      error: () => this.showToast('Errore salvataggio')
    });
  }

  // --- LOGICA MODALI ---
  async aggiungiIndirizzo() {
    const modal = await this.modalCtrl.create({
      component: NuovoIndirizzoModalComponent,
      componentProps: { clienteId: this.cliente?.id }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.creato) this.caricaDati(this.cliente!.id); // Ricarica tutto
  }

  async aggiungiCommessa() {
    const modal = await this.modalCtrl.create({
      component: NuovaCommessaModalComponent,
      componentProps: { clienteId: this.cliente?.id }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.creato) this.caricaDati(this.cliente!.id); // Ricarica tutto
  }

  async showToast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2000 });
    t.present();
  }
}