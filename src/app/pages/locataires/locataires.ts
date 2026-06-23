import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-locataires',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="head">
      <h1 class="ptitle">Locataires</h1>
      @if (admin()) { <a class="btn-add" routerLink="/app/contrats/nouveau">+ Nouveau locataire</a> }
    </div>
    <input class="input search" placeholder="Rechercher par nom..." [(ngModel)]="q" />
    @if (loading()) { <p class="muted">Chargement...</p> }
    @else if (filtered().length === 0) { <p class="muted">Aucun locataire.</p> }
    @else {
      @for (l of filtered(); track l.id) {
        <div class="card row" (click)="open(l)">
          <div class="av">{{ ini(l.name) }}</div>
          <div class="info">
            <div class="nm">{{ l.name }}</div>
            <div class="sub">{{ logement(l) }} · {{ l.telephone || '—' }}</div>
          </div>
          <div class="chev">›</div>
        </div>
      }
    }
  `,
  styles: [`
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
    .ptitle{color:var(--ink);margin:0}
    .btn-add{background:var(--gold);color:var(--ink);border-radius:10px;padding:10px 16px;font-weight:700;font-size:13px;text-decoration:none}
    .search{margin-bottom:14px;max-width:420px}
    .muted{color:var(--muted)}
    .row{display:flex;align-items:center;gap:12px;margin-bottom:10px;cursor:pointer}
    .row:hover{border-color:var(--gold)}
    .av{width:42px;height:42px;border-radius:50%;background:var(--gold);color:var(--ink);display:flex;align-items:center;justify-content:center;font-weight:bold}
    .info{flex:1}.nm{font-weight:600;color:var(--ink)}.sub{color:var(--muted);font-size:13px}
    .chev{color:var(--gold);font-size:24px}
  `],
})
export class Locataires implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  q = '';
  constructor(private api: Api, private router: Router, private auth: AuthService) {}
  admin() { const r = this.auth.role(); return r === 'admin' || r === 'super_admin'; }
  async ngOnInit() {
    try { this.items.set(await this.api.get('/locataires')); }
    finally { this.loading.set(false); }
  }
  filtered() {
    const q = this.q.toLowerCase().trim();
    return this.items().filter(l => !q || (l.name || '').toLowerCase().includes(q));
  }
  logement(l: any): string {
    const c = (l.contrats || [])[0];
    const lg = c?.logement; const im = lg?.immeuble;
    return lg ? `${im?.nom || ''} - ${lg.reference || ''}` : 'Sans logement';
  }
  ini(n: string) {
    const p = (n || '?').trim().split(' ').filter(Boolean);
    return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : (p[0] || '?').slice(0, 1)).toUpperCase();
  }
  open(l: any) {
    const c = (l.contrats || [])[0];
    if (c) this.router.navigate(['/app/contrats', c.id]);
    else alert("Ce locataire n'a pas de contrat détaillé.");
  }
}
