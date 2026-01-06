import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', // <--- Cambia da 'tabs' a 'login'
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'cliente-dettaglio',
    loadComponent: () =>
      import('./pages/cliente-dettaglio/cliente-dettaglio.page').then(
        (m) => m.ClienteDettaglioPage
      ),
  },
  {
    path: 'cliente-dettaglio/:id', // :id è il parametro dinamico
    loadComponent: () =>
      import('./pages/cliente-dettaglio/cliente-dettaglio.page').then(
        (m) => m.ClienteDettaglioPage
      ),
  },
];
