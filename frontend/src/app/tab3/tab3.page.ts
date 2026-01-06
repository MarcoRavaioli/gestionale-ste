import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, callOutline, searchOutline } from 'ionicons/icons';
import { ClienteService } from '../services/cliente.service';
import { Cliente } from '../interfaces/models';
import { NuovoClienteModalComponent } from '../components/nuovo-cliente-modal/nuovo-cliente-modal.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class Tab3Page implements OnInit {
  tuttiClienti: Cliente[] = []; // La lista completa originale
  clientiFiltrati: Cliente[] = []; // La lista che mostriamo (filtrata)
  ricerca: string = '';

  constructor(
    private clienteService: ClienteService,
    private modalCtrl: ModalController
  ) {
    // REGISTRA LE ICONE ANCHE QUI
    addIcons({ add, callOutline, searchOutline });
  }

  ngOnInit() {
    this.caricaClienti();
  }

  ionViewWillEnter() {
    // Ricarica se torni su questa tab
    this.caricaClienti();
  }

  caricaClienti(event?: any) {
    this.clienteService.getAll().subscribe({
      next: (data) => {
        this.tuttiClienti = data;
        this.filtraClienti(); // Applica il filtro corrente (se c'è testo)
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error(err);
        if (event) event.target.complete();
      },
    });
  }

  // Funzione di ricerca locale (veloce)
  filtraClienti() {
    const termine = this.ricerca.toLowerCase();
    if (!termine) {
      this.clientiFiltrati = this.tuttiClienti;
      return;
    }

    this.clientiFiltrati = this.tuttiClienti.filter(
      (c) =>
        c.nome.toLowerCase().includes(termine) ||
        c.email?.toLowerCase().includes(termine)
    );
  }

  // Apre la modale per aggiungere
  async apriNuovoCliente() {
    const modal = await this.modalCtrl.create({
      component: NuovoClienteModalComponent,
    });

    await modal.present();

    // Quando la modale si chiude, controlliamo se ha salvato qualcosa
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) {
      this.caricaClienti(); // Ricarichiamo la lista
    }
  }
}
