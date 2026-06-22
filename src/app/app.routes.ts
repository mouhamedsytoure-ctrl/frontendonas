import { Routes } from '@angular/router';
import { adminGuard, locataireGuard } from './core/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },

  // Vitrine publique (visiteurs, sans connexion)
  { path: 'vitrine',     loadComponent: () => import('./pages/vitrine/vitrine').then(m => m.Vitrine) },
  { path: 'vitrine/:id', loadComponent: () => import('./pages/vitrine/vitrine-detail').then(m => m.VitrineDetail) },
  { path: 'apropos',     loadComponent: () => import('./pages/apropos/apropos').then(m => m.Apropos) },

  // Espace locataire (responsive : ordinateur ET telephone, iPhone inclus)
  { path: 'espace', canActivate: [locataireGuard], loadComponent: () => import('./pages/espace/espace').then(m => m.Espace) },

  // Espace de gestion (admin / super admin uniquement)
  {
    path: 'app',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/shell/shell').then(m => m.Shell),
    children: [
      { path: '',                 loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'immeubles',        loadComponent: () => import('./pages/immeubles/immeubles').then(m => m.Immeubles) },
      { path: 'immeubles/:id',    loadComponent: () => import('./pages/immeubles/immeuble-detail').then(m => m.ImmeubleDetail) },
      { path: 'terrains',         loadComponent: () => import('./pages/terrains/terrains').then(m => m.Terrains) },
      { path: 'locataires',       loadComponent: () => import('./pages/locataires/locataires').then(m => m.Locataires) },
      { path: 'contrats',         loadComponent: () => import('./pages/contrats/contrats').then(m => m.Contrats) },
      { path: 'contrats/nouveau', loadComponent: () => import('./pages/contrats/nouveau-contrat').then(m => m.NouveauContrat) },
      { path: 'contrats/:id',     loadComponent: () => import('./pages/contrats/contrat-detail').then(m => m.ContratDetail) },
      { path: 'loyers',           loadComponent: () => import('./pages/loyers/loyers').then(m => m.Loyers) },
      { path: 'reclamations',     loadComponent: () => import('./pages/reclamations/reclamations').then(m => m.Reclamations) },
      { path: 'transferts',      loadComponent: () => import('./pages/transferts/transferts').then(m => m.Transferts) },
      { path: 'envois',          loadComponent: () => import('./pages/envois/envois').then(m => m.Envois) },
      { path: 'utilisateurs',     loadComponent: () => import('./pages/utilisateurs/utilisateurs').then(m => m.Utilisateurs) },
    ],
  },

  { path: '', pathMatch: 'full', redirectTo: 'vitrine' },
  { path: '**', redirectTo: 'vitrine' },
];
