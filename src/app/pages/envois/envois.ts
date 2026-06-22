import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, fcfa } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-envois',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="h">
      <div><h1 class="ptitle">Envois</h1><div class="sub">{{ canWrite() ? 'Saisis chaque envoi demandé' : 'Observation — totaux et historique' }}</div></div>
      <div class="hr">
        <select class="period" [(ngModel)]="mois">
          @for (m of moisOptions(); track m.v) { <option [ngValue]="m.v">{{ m.l }}</option> }
        </select>
        @if (canWrite()) { <button class="add" (click)="ouvrir()">+ Nouvel envoi</button> }
      </div>
    </div>

    @if (loading()) { <p class="muted">Chargement...</p> }
    @else {
      <div class="kpis">
        <div class="kpi hero"><div class="l">Total envoyé ({{ moisLabel() }})</div><div class="v">{{ fcfa(totMois()) }} <span>FCFA</span></div><div class="s">{{ ops().length }} envoi(s)</div></div>
        <div class="kpi"><div class="l">Total général</div><div class="v">{{ fcfa(totAll()) }}</div><div class="s">{{ all().length }} envoi(s)</div></div>
        <div class="kpi"><div class="l">Bénéficiaires (mois)</div><div class="v">{{ nbBenef() }}</div></div>
      </div>

      <div class="filters"><input [(ngModel)]="q" placeholder="Rechercher un bénéficiaire..." /></div>

      <div class="secttl">Envois — {{ moisLabel() }}</div>
      @if (filtres().length===0) { <p class="muted">Aucun envoi pour cette période.</p> }
      @for (o of filtres(); track o.id) {
        <div class="card env">
          <div class="ei">📨</div>
          <div class="ec">
            <div class="e1">Envoi de <b>{{ fcfa(o.montant) }} FCFA</b> à <b>{{ o.beneficiaire }}</b></div>
            <div class="e2">le {{ date(o.created_at) }} · par <b>{{ o.agent?.name || 'Agent' }}</b>@if (o.motif) { <span class="muted"> · {{ o.motif }}</span> }</div>
          </div>
          @if (canWrite()) { <button class="del" (click)="supprimer(o)">✕</button> }
        </div>
      }

      @if (parBenef().length) {
        <div class="secttl">Total par bénéficiaire ({{ moisLabel() }})</div>
        <div class="jcard">
          @for (b of parBenef(); track b.nom) {
            <div class="brow"><span>{{ b.nom }}</span><span class="r"><b>{{ fcfa(b.total) }} FCFA</b> <span class="muted">{{ b.n }}×</span></span></div>
          }
        </div>
      }
    }

    @if (modal()) {
      <div class="ov" (click)="fermer()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>➕ Nouvel envoi</h3>
          <div class="field"><label>Bénéficiaire (à qui)</label><input [(ngModel)]="nBenef" placeholder="Nom" /></div>
          <div class="two">
            <div class="field"><label>Montant (FCFA)</label><input type="number" [(ngModel)]="nMontant" placeholder="50000" /></div>
            <div class="field"><label>Téléphone (option)</label><input [(ngModel)]="nTel" placeholder="77 ..." /></div>
          </div>
          <div class="field"><label>Motif (option)</label><input [(ngModel)]="nMotif" placeholder="ex: loyer, marché, dépannage..." /></div>
          @if (err()) { <div class="errm">{{ err() }}</div> }
          <div class="mrow"><button (click)="fermer()">Annuler</button><button class="save" [disabled]="busy()" (click)="enregistrer()">Enregistrer</button></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .h{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-bottom:14px}
    .ptitle{color:var(--ink);margin:0}.sub{color:var(--muted);font-size:12px}
    .hr{display:flex;gap:8px;align-items:center}
    .period{border:1px solid var(--line);border-radius:9px;padding:8px 12px;font-size:13px;color:var(--ink);background:#fff}
    .add{background:var(--gold);color:var(--ink);border:none;border-radius:9px;padding:9px 14px;font-weight:700;font-size:12px;cursor:pointer}
    .muted{color:var(--muted)}
    .kpis{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px}
    .kpi{flex:1;min-width:150px;background:#fff;border:1px solid var(--line);border-radius:13px;padding:13px}
    .kpi.hero{background:linear-gradient(135deg,var(--ink),var(--ink2,#244039));color:#fff;border:none}
    .kpi .l{font-size:11px;color:var(--muted)}.kpi.hero .l{color:#cfe0d9}
    .kpi .v{font-size:20px;font-weight:800;margin-top:2px}.kpi .v span{font-size:11px}
    .kpi .s{font-size:10px;color:var(--muted)}.kpi.hero .s{color:#cfe0d9}
    .filters{margin-bottom:8px}
    .filters input{width:100%;max-width:320px;border:1px solid var(--line);border-radius:8px;padding:9px 10px;font-size:12px;color:var(--ink);background:#fff;font-family:inherit}
    .secttl{font-size:13px;font-weight:700;margin:16px 0 10px;color:var(--ink)}
    .card{background:#fff;border:1px solid var(--line);border-radius:13px;padding:13px;margin-bottom:9px}
    .env{display:flex;align-items:center;gap:12px}
    .ei{width:36px;height:36px;border-radius:50%;background:#E7F1EC;display:flex;align-items:center;justify-content:center}
    .ec{flex:1}.e1{color:var(--ink);font-size:14px}.e2{color:var(--muted);font-size:12px}
    .del{color:var(--bad);border:none;background:none;cursor:pointer;font-size:15px}
    .jcard{background:#fff;border:1px solid var(--line);border-radius:13px;padding:4px 14px}
    .brow{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-top:1px solid var(--line);font-size:13px}
    .brow:first-child{border-top:none}.brow .r{display:flex;gap:8px;align-items:center}.brow b{color:var(--ink)}
    .ov{position:fixed;inset:0;background:rgba(13,28,25,.5);display:flex;align-items:center;justify-content:center;padding:18px;z-index:60}
    .modal{background:#fff;border-radius:16px;max-width:460px;width:100%;padding:18px;max-height:90vh;overflow:auto}
    .modal h3{margin:0 0 14px}
    .field{margin-bottom:10px}.field label{display:block;font-size:10px;color:var(--muted);margin-bottom:4px}
    .field input{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px;font-size:13px;font-family:inherit}
    .two{display:flex;gap:10px}.two>div{flex:1}
    .errm{color:var(--bad);margin-top:8px;font-size:13px}
    .mrow{display:flex;gap:10px;margin-top:12px}
    .mrow button{flex:1;border-radius:10px;padding:11px;font-weight:700;cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--ink)}
    .mrow .save{background:var(--gold);border-color:var(--gold)}
  `],
})
export class Envois implements OnInit {
  fcfa = fcfa;
  loading = signal(true);
  busy = signal(false);
  modal = signal(false);
  err = signal<string | null>(null);
  private _all = signal<any[]>([]);
  mois = new Date().toISOString().slice(0, 7);
  q = '';
  nBenef = ''; nTel = ''; nMontant: number | null = null; nMotif = '';

  constructor(private api: Api, private auth: AuthService) {}
  canWrite() { return this.auth.role() === 'admin'; }

  async ngOnInit() { await this.charger(); }
  async charger() { this.loading.set(true); try { this._all.set(await this.api.get('/envois')); } finally { this.loading.set(false); } }

  all() { return this._all(); }
  ops() { return this._all().filter(o => (o.created_at || '').slice(0, 7) === this.mois); }
  filtres() { return this.ops().filter(o => !this.q || (o.beneficiaire || '').toLowerCase().includes(this.q.toLowerCase())); }
  totMois() { return this.ops().reduce((s, o) => s + Number(o.montant), 0); }
  totAll() { return this._all().reduce((s, o) => s + Number(o.montant), 0); }
  nbBenef() { return new Set(this.ops().map(o => (o.beneficiaire || '').toLowerCase())).size; }
  parBenef() {
    const map = new Map<string, { nom: string; total: number; n: number }>();
    this.ops().forEach(o => { const k = (o.beneficiaire || '—'); const e = map.get(k) || { nom: k, total: 0, n: 0 }; e.total += Number(o.montant); e.n += 1; map.set(k, e); });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }
  date(d: string) { const x = new Date(d); return isNaN(+x) ? '' : x.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  moisTxt(m: string) { const [y, mo] = m.split('-'); const d = new Date(Number(y), Number(mo) - 1, 1); return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); }
  moisLabel() { return this.moisTxt(this.mois); }
  moisOptions() { const out: any[] = []; const now = new Date(); for (let i = 0; i < 12; i++) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push({ v: d.toISOString().slice(0, 7), l: this.moisTxt(d.toISOString().slice(0, 7)) }); } return out; }

  ouvrir() { this.err.set(null); this.nBenef = ''; this.nTel = ''; this.nMontant = null; this.nMotif = ''; this.modal.set(true); }
  fermer() { this.modal.set(false); }
  async enregistrer() {
    if (!this.nBenef.trim()) { this.err.set('Indique le bénéficiaire.'); return; }
    if (!this.nMontant) { this.err.set('Indique le montant.'); return; }
    this.busy.set(true);
    try { await this.api.post('/envois', { beneficiaire: this.nBenef, telephone: this.nTel, montant: this.nMontant, motif: this.nMotif }); this.modal.set(false); await this.charger(); }
    catch (e: any) { this.err.set(e?.error?.message || 'Enregistrement impossible.'); }
    finally { this.busy.set(false); }
  }
  async supprimer(o: any) { await this.api.del('/envois/' + o.id); await this.charger(); }
}
