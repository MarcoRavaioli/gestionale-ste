import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonAvatar,
  IonSkeletonText,
  IonLabel,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForward,
  createOutline,
  peopleOutline,
  add,
} from 'ionicons/icons';
import { Cliente } from '../../interfaces/models';

@Component({
  selector: 'app-lista-clienti',
  templateUrl: './lista-clienti.component.html',
  styleUrls: ['./lista-clienti.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonAvatar,
    IonSkeletonText,
    IonLabel,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonButton,
  ],
})
export class ListaClientiComponent {
  @Input() clienti: Cliente[] = [];
  @Input() isLoading: boolean = false;
  @Input() isAllLoaded: boolean = false;

  @Output() loadMore = new EventEmitter<any>();
  @Output() itemClick = new EventEmitter<Cliente>();
  @Output() addClick = new EventEmitter<void>();

  constructor() {
    addIcons({ chevronForward, createOutline, peopleOutline, add });
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
