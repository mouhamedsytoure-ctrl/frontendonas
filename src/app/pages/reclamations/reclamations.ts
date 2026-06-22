import { Component, signal, OnInit } from '@angular/core';
import { Api } from '../../core/api.service';

@Component({
  selector: 'app-reclamations',
  standalone: true,
  template: `
    <h1 class="ptitle">Réclamations</h1>
    <div class="chips">
      <button [class.on]="f()==='toutes'" (click)="f.set('toutes')">Toutes</button>
      <button [class.on]="f()==='ouvert'" (click)="f.set('ouvert')">Ouvertes</button>
      <button [class.on]="f()==='en_cours'" (click)="f.set('en_cours')">En cours</button>
      <button [class.on]="f()==='resolu'" (click)="f.set('resolu')">Résolues</button>
    </div>
    @if (loading()) { <p class="muted">Chargement...</p> }
    @else if (view().length === 0) { <p class="muted">Aucune réclamation.</p> }
    @else {
      @for (r of view(); track r.id) {
        <div class="card">
          <div class="top">
            <b>{{ r.objet }}</b>
            <span class="badge" [style.background]="prioBg(r.priorite)" [style.color]="prioFg(r.priorite)">priorité {{ r.priorite || '—' }}</span>
          </div>

          <!-- Auteur de la reclamation -->
          <div class="auteur">
            <div class="av">{{ ini(nom(r)) }}</div>
            <div class="who">
              <div class="nm">{{ nom(r) }}</div>
              <div class="tel">📞 {{ tel(r) || 'Téléphone non renseigné' }}</div>
              @if (logement(r)) { <div class="lg">🏠 {{ logement(r) }}</div> }
            </div>
            @if (tel(r)) { <a class="appeler" [href]="'tel:' + tel(r)">Appeler</a> }
          </div>

          @if (r.description) { <p class="desc">{{ r.description }}</p> }

          <div class="botline">
            <span class="badge2" [style.background]="bg(r.statut)" [style.color]="fg(r.statut)">{{ r.statut }}</span>
            <div class="acts">
              @if (r.statut === 'ouvert') { <button class="btn small ink" (click)="set(r,'en_cours')">Prendre en charge</button> }
              @if (r.statut !== 'resolu') { <button class="btn small gold" (click)="set(r,'resolu')">Marquer résolu</button> }
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .ptitle{color:var(--ink);margin:0 0 14px} .muted{color:var(--muted)}
    .chips{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
    .chips button{border:1px solid var(--line);background:#fff;border-radius:99px;padding:7px 14px;cursor:pointer;color:var(--ink)}
    .chips button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
    .card{margin-bottom:12px}
    .top{display:flex;justify-content:space-between;align-items:center;gap:10px}
    .top b{color:var(--ink)}
    .auteur{display:flex;align-items:center;gap:12px;margin:10px 0;padding:10px;background:var(--bg);border-radius:12px}
    .av{width:40px;height:40px;border-radius:50%;background:var(--gold);color:var(--ink);display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0}
    .who{flex:1} .nm{font-weight:700;color:var(--ink)} .tel{color:var(--ink);font-size:13px} .lg{color:var(--muted);font-size:12px}
    .appeler{background:var(--ok);color:#fff;text-decoration:none;font-weight:700;padding:9px 16px;border-radius:10px}
    .desc{color:var(--ink);font-size:14px;margin:6px 0}
    .botline{display:flex;justify-content:space-between;align-items:center;margin-top:8px}
    .badge2{font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px}
    .acts{display:flex;gap:8px}
    .small{padding:7px 12px;font-size:13px}.ink{background:var(--ink);color:#fff}.gold{background:var(--gold);color:var(--ink)}
  `],
})
export class Reclamations implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  f = signal<'toutes' | 'ouvert' | 'en_cours' | 'resolu'>('toutes');
  constructor(private api: Api) {}
  async ngOnInit() { await this.load(); }
  async load() {
    this.loading.set(true);
    try {
      const data = await this.api.get('/reclamations');
      // priorite la plus haute d'abord, puis les plus recentes
      (data as any[]).sort((a, b) => this.prioRank(b.priorite) - this.prioRank(a.priorite));
      this.items.set(data);
    } finally { this.loading.set(false); }
  }
  view() { const f = this.f(); return this.items().filter(r => f === 'toutes' || r.statut === f); }
  async set(r: any, statut: string) { await this.api.put('/reclamations/' + r.id, { statut }); await this.load(); }

  // auteur
  nom(r: any) { return r.locataire?.name || r.user?.name || 'Locataire'; }
  tel(r: any) { return r.locataire?.telephone || r.user?.telephone || ''; }
  logement(r: any) { const l = r.logement; const im = l?.immeuble; return l ? `${im?.nom || ''} ${l.reference || ''}`.trim() : ''; }
  ini(n: string) { const p = (n || '?').trim().split(' ').filter(Boolean); return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : (p[0] || '?').slice(0, 1)).toUpperCase(); }

  // statut
  bg(s: string) { return s === 'resolu' ? '#E7F1EC' : (s === 'en_cours' ? '#FBEEDD' : '#FBE3E0'); }
  fg(s: string) { return s === 'resolu' ? 'var(--ok)' : (s === 'en_cours' ? 'var(--warn)' : 'var(--bad)'); }

  // priorite
  prioRank(p: string) { p = (p || '').toLowerCase(); if (p.startsWith('haut') || p.startsWith('elev') || p.startsWith('urg')) return 3; if (p.startsWith('moy') || p.startsWith('norm')) return 2; return 1; }
  prioBg(p: string) { const r = this.prioRank(p); return r === 3 ? '#FBE3E0' : (r === 2 ? '#FBEEDD' : '#E7F1EC'); }
  prioFg(p: string) { const r = this.prioRank(p); return r === 3 ? 'var(--bad)' : (r === 2 ? 'var(--warn)' : 'var(--ok)'); }
}
