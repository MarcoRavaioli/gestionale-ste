import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AppuntamentoService } from '../services/appuntamento.service';
import { Appuntamento } from '../interfaces/models';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class Tab1Page implements OnInit {
  appuntamentiOggi: Appuntamento[] = [];
  userNome = 'Mario'; // Poi lo prenderemo dal Token

  constructor(private appuntamentoService: AppuntamentoService) {}

  ngOnInit() {
    this.caricaAppuntamenti();
  }

  caricaAppuntamenti() {
    // In un'app reale filtreremmo per data lato backend o qui
    this.appuntamentoService.getAll().subscribe({
      next: (data) => {
        this.appuntamentiOggi = data; // Per ora mostriamo tutto
      },
      error: (err) => console.error(err)
    });
  }
  
  doRefresh(event: any) {
    this.caricaAppuntamenti();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}