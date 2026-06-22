import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

interface MenuItem { label: string; path: string; icon: string; superAdminOnly?: boolean; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  logo = environment.apiUrl.replace('/api', '') + '/logo-toursen.jpeg';
  open = signal(false); // menu mobile

  menu: MenuItem[] = [
    { label: 'Tableau de bord', path: '/app',              icon: '▦' },
    { label: 'Immeubles',       path: '/app/immeubles',    icon: '🏢' },
    { label: 'Terrains',        path: '/app/terrains',     icon: '🗺' },
    { label: 'Locataires',      path: '/app/locataires',   icon: '👥' },
    { label: 'Contrats',        path: '/app/contrats',     icon: '📄' },
    { label: 'Loyers',          path: '/app/loyers',       icon: '💰' },
    { label: 'Réclamations',    path: '/app/reclamations', icon: '🛠' },
    { label: 'Transferts',      path: '/app/transferts',   icon: '💸' },
    { label: 'Envois',          path: '/app/envois',       icon: '📨' },
    { label: 'Utilisateurs',    path: '/app/utilisateurs', icon: '🔑', superAdminOnly: true },
  ];

  constructor(public auth: AuthService, private router: Router) {}

  visibleMenu() {
    const isSuper = this.auth.role() === 'super_admin';
    return this.menu.filter(m => !m.superAdminOnly || isSuper);
  }

  roleLabel(): string {
    switch (this.auth.role()) {
      case 'super_admin': return 'Super administrateur';
      case 'admin': return 'Administrateur';
      default: return this.auth.role();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
