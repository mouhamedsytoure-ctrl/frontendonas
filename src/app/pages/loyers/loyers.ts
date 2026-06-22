import { Component, signal, OnInit, computed } from '@angular/core';
import { Api, fcfa } from '../../core/api.service';

@Component({
  selector: 'app-loyers',
  standalone: true,
  template: `
    <h1 class="ptitle">Loyers — {{ periode }}</h1>
    @if (loading()) { <p class="muted">Chargement...</p> }
    @else {
      <div class="chips">
        <button [class.on]="filtre()==='tous'" (click)="filtre.set('tous')">Tous</button>
        <button [class.on]="filtre()==='impayes'" (click)="filtre.set('impayes')">Non payés</button>
        <button [class.on]="filtre()==='payes'" (click)="filtre.set('payes')">Payés</button>
      </div>
      @for (r of view(); track r.id) {
        <div class="card row">
          <div class="info"><div class="nm">{{ r.name }}</div><div class="sub">{{ r.logement }} · {{ fcfa(r.loyer) }} FCFA</div></div>
          <span class="badge" [style.background]="r.paye ? '#E7F1EC':'#FBE3E0'" [style.color]="r.paye ? 'var(--ok)':'var(--bad)'">
            {{ r.paye ? 'Payé' : 'Non payé' }}
          </span>
        </div>
      }
      @if (view().length === 0) { <p class="muted">Aucun élément.</p> }
    }
  `,
  styles: [`
    .ptitle{color:var(--ink);margin:0 0 14px}
    .muted{color:var(--muted)}
    .chips{display:flex;gap:8px;margin-bottom:14px}
    .chips button{border:1px solid var(--line);background:#fff;border-radius:99px;padding:7px 14px;cursor:pointer;color:var(--ink)}
    .chips button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
    .row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
    .nm{font-weight:600;color:var(--ink)}.sub{color:var(--muted);font-size:13px}
  `],
})
export class Loyers implements OnInit {
  rows = signal<any[]>([]);
  loading = signal(true);
  filtre = signal<'tous' | 'impayes' | 'payes'>('tous');
  periode = new Date().toISOString().slice(0, 7);
  fcfa = fcfa;
  constructor(private api: Api) {}
  async ngOnInit() {
    try {
      const [locs, pays]: any = await Promise.all([this.api.get('/locataires'), this.api.get('/paiements')]);
      const payeIds = new Set((pays as any[])
        .filter(p => p.periode === this.periode && p.statut === 'paye')
        .map(p => p.user_id));
      const rows = (locs as any[]).map(l => {
        const c = (l.contrats || [])[0]; const lg = c?.logement; const im = lg?.immeuble;
        return { id: l.id, name: l.name, loyer: c?.montant_loyer || 0,
          logement: lg ? `${im?.nom || ''} - ${lg.reference || ''}` : '—',
          paye: payeIds.has(l.id) };
      }).filter(r => r.loyer > 0);
      this.rows.set(rows);
    } finally { this.loading.set(false); }
  }
  view() {
    const f = this.filtre();
    return this.rows().filter(r => f === 'tous' || (f === 'payes' ? r.paye : !r.paye));
  }
}
