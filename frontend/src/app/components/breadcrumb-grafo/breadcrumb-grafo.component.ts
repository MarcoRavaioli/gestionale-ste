import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonBreadcrumbs,
  IonBreadcrumb,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb-grafo',
  templateUrl: './breadcrumb-grafo.component.html',
  styleUrls: ['./breadcrumb-grafo.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonBreadcrumbs, IonBreadcrumb, IonIcon],
})
export class BreadcrumbGrafoComponent {
  @Input() items: BreadcrumbItem[] = [];

  constructor() {
    addIcons({ chevronForwardOutline });
  }
}
