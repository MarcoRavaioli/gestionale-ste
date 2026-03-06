import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonSkeletonText,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward, location, businessOutline, add } from 'ionicons/icons';
import { Indirizzo } from '../../interfaces/models';

@Component({
  selector: 'app-lista-cantieri',
  templateUrl: './lista-cantieri.component.html',
  styleUrls: ['./lista-cantieri.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonSkeletonText,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonButton,
  ],
})
export class ListaCantieriComponent {
  @Input() cantieri: Indirizzo[] = [];
  @Input() isLoading: boolean = false;
  @Input() isAllLoaded: boolean = false;

  @Output() loadMore = new EventEmitter<any>();
  @Output() itemClick = new EventEmitter<Indirizzo>();
  @Output() addClick = new EventEmitter<void>();

  constructor() {
    addIcons({ chevronForward, location, businessOutline, add });
  }

  onLoadMore(event: any) {
    if (this.isAllLoaded) {
      event.target.complete();
      event.target.disabled = true;
    } else {
      this.loadMore.emit(event);
    }
  }
}
