import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentOutline,
  downloadOutline,
  searchOutline,
} from 'ionicons/icons';
import { AllegatoService } from '../../services/allegato.service';
import { Allegato } from '../../interfaces/models';

@Component({
  selector: 'app-lista-documenti',
  templateUrl: './lista-documenti.component.html',
  styleUrls: ['./lista-documenti.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSpinner,
  ],
})
export class ListaDocumentiComponent implements OnInit {
  documenti: Allegato[] = [];
  currentPage = 1;
  totalPages = 1;
  isLoading = false;

  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;

  constructor(private allegatoService: AllegatoService) {
    addIcons({ documentOutline, downloadOutline, searchOutline });
  }

  ngOnInit() {
    this.caricaDocumenti(true);
  }

  // Chiamato da tab3.page.ts se la stringa di ricerca cambia (opzionale)
  public onSearch(searchTerm: string) {
    // Al momento l'endpoint paginated non usa search dal DTO nel backend, ma possiamo implementarlo.
    // this.caricaDocumenti(true, searchTerm);
  }

  caricaDocumenti(reset = false, searchStr = '') {
    if (reset) {
      this.currentPage = 1;
      this.documenti = [];
      this.isLoading = true;
    }

    this.allegatoService
      .getPaginated(this.currentPage, 20, searchStr)
      .subscribe({
        next: (res) => {
          this.documenti = [...this.documenti, ...res.data];
          this.totalPages = res.totalPages;
          this.isLoading = false;

          if (this.infiniteScroll) {
            this.infiniteScroll.complete();
            if (this.currentPage >= this.totalPages) {
              this.infiniteScroll.disabled = true;
            } else {
              this.infiniteScroll.disabled = false;
            }
          }
        },
        error: (err) => {
          console.error('Errore nel caricamento documenti', err);
          this.isLoading = false;
          if (this.infiniteScroll) {
            this.infiniteScroll.complete();
          }
        },
      });
  }

  loadMoreData(event: any) {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.caricaDocumenti();
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }

  apriDocumento(id: number) {
    this.allegatoService.apriFileSicuro(id);
  }

  getSottotitolo(doc: Allegato): string {
    if (doc.commessa) return `Commessa: ${doc.commessa.seriale}`;
    if (doc.cliente) return `Cliente: ${doc.cliente.nome}`;
    if (doc.appuntamento) return `Appunt.: ${doc.appuntamento.nome}`;
    if (doc.indirizzo)
      return `Cantiere: ${doc.indirizzo.via} ${doc.indirizzo.civico}`;
    return 'Documento Globale';
  }
}
