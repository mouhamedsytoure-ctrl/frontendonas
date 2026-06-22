import { SlicePipe } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api.service';

@Component({
  selector: 'app-contrats',
  standalone: true,
  imports: [RouterLink, FormsModule, SlicePipe],
  template: `
    <h1 class="ptitle">Contrats</h1>
    <input class="input search" placeholder="Rechercher par nom..." [(ngModel)]="q" />
    <div class="chips">
      <button [class.on]="f()==='actifs'" (click)="setF('actifs')">Actifs</button>
      <button [class.on]="f()==='expire'" (click)="setF('expire')">Expire bientôt</button>
      <button [class.on]="f()==='archives'" (click)="setF('archives')">Archivés</button>
    </div>
    @if (loading()) { <p class="muted">Chargement...</p> }
    @else if (view().length === 0) { <p class="muted">Aucun contrat.</p> }
    @else {
      @for (c of view(); track c.id) {
        <a class="card row" [routerLink]="['/app/contrats', c.id]">
          <div class="info">
            <div class="nm">{{ nom(c) }}</div>
            <div class="sub">{{ logement(c) }} @if (c.date_fin) { · Fin {{ c.date_fin | slice:0:10 }} }</div>
          </div>
          <div class="r">
            <span class="badge" [style.background]="bg(c)" [style.color]="fg(c)">{{ c.statut }}</span>
            @if (joursBadge(c); as j) { <span class="badge warn">{{ j }}</span> }
          </div>
        </a>
      }
    }
  `,
  styles: [`
    .ptitle{color:var(--ink);margin:0 0 14px}
    .search{margin-bottom:12px;max-width:420px}
    .muted{color:var(--muted)}
    .chips{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
    .chips button{border:1px solid var(--line);background:#fff;border-radius:99px;padding:7px 14px;cursor:pointer;color:var(--ink)}
    .chips button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
    .row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;text-decoration:none}
    .row:hover{border-color:var(--gold)}
    .nm{font-weight:600;color:var(--ink)}.sub{color:var(--muted);font-size:13px}
    .r{display:flex;gap:8px;align-items:center}
    .warn{background:#FBEEDD;color:var(--warn)}
  `],
})
export class Contrats implements OnInit {
  all = signal<any[]>([]);
  loading = signal(true);
  f = signal<'actifs' | 'expire' | 'archives'>('actifs');
  q = '';
  constructor(private api: Api) {}
  async ngOnInit() { await this.load(); }
  setF(v: any) { this.f.set(v); this.load(); }
  async load() {
    this.loading.set(true);
    try { this.all.set(await this.api.get('/contrats' + (this.f() === 'archives' ? '?archive=1' : ''))); }
    finally { this.loading.set(false); }
  }
  jours(c: any): number | null {
    if (!c.date_fin) return null;
    const d = new Date(c.date_fin); if (isNaN(+d)) return null;
    return Math.floor((+d - Date.now()) / 86400000);
  }
  joursBadge(c: any): string | null {
    if (c.statut !== 'actif') return null;
    const j = this.jours(c); if (j === null) return null;
    if (j < 0) return 'Expiré'; if (j <= 30) return 'Expire dans ' + j + ' j'; return null;
  }
  view() {
    const q = this.q.toLowerCase().trim();
    return this.all().filter(c => {
      if (this.f() === 'expire') { const j = this.jours(c); if (c.statut !== 'actif' || j === null || j > 30) return false; }
      if (q && !this.nom(c).toLowerCase().includes(q)) return false;
      return true;
    });
  }
  nom(c: any) { return `${c.preneur_prenom || ''} ${c.preneur_nom || ''}`.trim() || '(sans nom)'; }
  logement(c: any) { const lg = c.logement; const im = lg?.immeuble; return lg ? `${im?.nom || ''} - ${lg.reference || ''}` : ''; }
  bg(c: any) { return c.statut === 'resilie' ? '#FBE3E0' : (c.est_bloque ? '#FBEEDD' : '#E7F1EC'); }
  fg(c: any) { return c.statut === 'resilie' ? 'var(--bad)' : (c.est_bloque ? 'var(--warn)' : 'var(--ok)'); }
}
