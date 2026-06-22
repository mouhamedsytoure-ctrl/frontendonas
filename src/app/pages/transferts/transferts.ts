import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, fcfa } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

type Tab = 'global' | 'stats' | 'envois' | 'journal' | 'baremes';

@Component({
  selector: 'app-transferts',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="h">
      <div><h1 class="ptitle">{{ titre() }}</h1><div class="sub">{{ sousTitre() }}</div></div>
      @if (tab()==='global' || tab()==='envois' || tab()==='journal') {
        <select class="period" [(ngModel)]="mois">
          @for (m of moisOptions(); track m.v) { <option [ngValue]="m.v">{{ m.l }}</option> }
        </select>
      }
    </div>

    <div class="tabs">
      <button [class.on]="tab()==='global'" (click)="tab.set('global')">Vue globale</button>
      <button [class.on]="tab()==='stats'" (click)="tab.set('stats')">Statistiques</button>
      <button [class.on]="tab()==='envois'" (click)="tab.set('envois')">Envois</button>
      <button [class.on]="tab()==='journal'" (click)="tab.set('journal')">Journal</button>
      <button [class.on]="tab()==='baremes'" (click)="tab.set('baremes')">Barèmes</button>
      @if (canWrite()) { <button class="add" (click)="ouvrir()">+ Nouvelle opération</button> }
    </div>

    @if (loading()) { <p class="muted">Chargement...</p> }
    @else {
      <!-- VUE GLOBALE (mois choisi) -->
      @if (tab()==='global') {
        <div class="kpis">
          <div class="kpi hero"><div class="l">Commissions gagnées</div><div class="v">{{ fcfa(totComm(ops())) }} <span>FCFA</span></div><div class="s">{{ ops().length }} opérations</div></div>
          <div class="kpi"><div class="l">Total envoyé 📤</div><div class="v">{{ fcfa(totEnvoi(ops())) }}</div></div>
          <div class="kpi"><div class="l">Total retiré 📥</div><div class="v">{{ fcfa(totRetrait(ops())) }}</div></div>
          <div class="kpi"><div class="l">Opérations</div><div class="v">{{ ops().length }}</div></div>
        </div>
        <div class="secttl">Par service ({{ moisLabel() }})</div>
        <div class="svc">
          @for (s of services; track s.id) {
            <div class="scard" [style.border-top-color]="s.color">
              <div class="nm">{{ s.label }} <span class="tag">{{ nb(ops(),s.id) }} op.</span></div>
              <div class="ln"><span class="muted">Envoyé</span><b>{{ fcfa(sumSvc(ops(),s.id,'envoi')) }}</b></div>
              <div class="ln"><span class="muted">Retiré</span><b>{{ fcfa(sumSvc(ops(),s.id,'retrait')) }}</b></div>
              <div class="comm">Commission : {{ fcfa(commSvc(ops(),s.id)) }}</div>
            </div>
          }
        </div>
      }

      <!-- STATISTIQUES (tout l'historique) -->
      @if (tab()==='stats') {
        <div class="kpis">
          <div class="kpi hero"><div class="l">Commissions totales</div><div class="v">{{ fcfa(totComm(all())) }} <span>FCFA</span></div><div class="s">{{ all().length }} opérations</div></div>
          <div class="kpi"><div class="l">Total envoyé 📤</div><div class="v">{{ fcfa(totEnvoi(all())) }}</div></div>
          <div class="kpi"><div class="l">Total retiré 📥</div><div class="v">{{ fcfa(totRetrait(all())) }}</div></div>
        </div>

        <div class="secttl">Commissions par service (total)</div>
        <div class="svc">
          @for (s of services; track s.id) {
            <div class="scard" [style.border-top-color]="s.color">
              <div class="nm">{{ s.label }} <span class="tag">{{ nb(all(),s.id) }} op.</span></div>
              <div class="ln"><span class="muted">Envoyé</span><b>{{ fcfa(sumSvc(all(),s.id,'envoi')) }}</b></div>
              <div class="ln"><span class="muted">Retiré</span><b>{{ fcfa(sumSvc(all(),s.id,'retrait')) }}</b></div>
              <div class="comm">Commission : {{ fcfa(commSvc(all(),s.id)) }}</div>
            </div>
          }
        </div>

        <div class="secttl">Commissions par mois</div>
        <div class="months">
          @if (parMois().length===0) { <p class="muted">Aucune donnée.</p> }
          @for (m of parMois(); track m.mois) {
            <div class="mrow">
              <div class="ml">{{ m.label }}</div>
              <div class="bar"><div class="fill" [style.width.%]="m.pct"></div></div>
              <div class="mc">{{ fcfa(m.commission) }}</div>
              <div class="mn">{{ m.n }} op.</div>
            </div>
          }
        </div>
      }

      <!-- ENVOIS -->
      @if (tab()==='envois') {
        <div class="secttl">Envois — « envoi à … »</div>
        @if (envois().length===0) { <p class="muted">Aucun envoi pour cette période.</p> }
        @for (o of envois(); track o.id) {
          <div class="card env">
            <div class="ei">📤</div>
            <div class="ec">
              <div class="e1">Envoi à <b>{{ o.client || '—' }}</b> @if (o.destination) { <span class="muted">· vers {{ o.destination }}</span> }</div>
              <div class="e2">{{ label(o.service) }} · {{ fcfa(o.montant) }} FCFA · le {{ date(o.created_at) }} · par <b>{{ o.agent?.name || 'Agent' }}</b></div>
            </div>
            <div class="ecom">+{{ fcfa(o.commission) }}</div>
          </div>
        }
      }

      <!-- JOURNAL -->
      @if (tab()==='journal') {
        <div class="filters">
          <select [(ngModel)]="fService"><option value="">Tous services</option>@for (s of services; track s.id) { <option [value]="s.id">{{ s.label }}</option> }</select>
          <select [(ngModel)]="fType"><option value="">Tous types</option><option value="envoi">Envoi</option><option value="retrait">Retrait</option></select>
          <input [(ngModel)]="fQ" placeholder="Rechercher un client..." />
        </div>
        <div class="jcard scrollx">
          <table>
            <thead><tr><th>Type</th><th>Service</th><th>Client</th><th>Vers</th><th>Montant</th><th>Commission</th><th>Date</th><th>Agent</th>@if (canWrite()) { <th></th> }</tr></thead>
            <tbody>
              @if (filtres().length===0) { <tr><td colspan="9" class="empty">Aucune opération.</td></tr> }
              @for (o of filtres(); track o.id) {
                <tr>
                  <td><span class="pill" [class.p-env]="o.type==='envoi'" [class.p-ret]="o.type==='retrait'">{{ o.type==='envoi'?'Envoi':'Retrait' }}</span></td>
                  <td>{{ label(o.service) }}</td><td>{{ o.client||'-' }}</td><td>{{ o.destination||'-' }}</td>
                  <td><b>{{ fcfa(o.montant) }}</b></td><td class="comm2">{{ fcfa(o.commission) }}</td>
                  <td>{{ date(o.created_at) }}</td><td class="muted">{{ o.agent?.name||'' }}</td>
                  @if (canWrite()) { <td><button class="del" (click)="supprimer(o)">✕</button></td> }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- BAREMES -->
      @if (tab()==='baremes') {
        @if (!canWrite()) {
          <div class="secttl">Barèmes de commission (lecture seule)</div>
          <p class="muted small">Les barèmes sont gérés par l'agent. Vue d'observation pour le super admin.</p>
          @for (b of baremes(); track b.id) {
            <div class="bcard ro">
              <b>{{ label(b.service) }} · {{ b.type==='envoi'?'Envoi':'Retrait' }}</b>
              <span class="val-ro">{{ baremeTxt(b) }}</span>
            </div>
          }
        } @else {
          <div class="secttl">Barèmes de commission — pourcentages / montants (envoi &amp; retrait)</div>
          @for (b of baremes(); track b.id) {
            <div class="bcard">
              <div class="bh"><b>{{ label(b.service) }} · {{ b.type==='envoi'?'Envoi':'Retrait' }}</b></div>
              <div class="brow">
                <label>Mode</label>
                <select [(ngModel)]="b.mode" (ngModelChange)="onMode(b)">
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixe">Montant fixe</option>
                  <option value="paliers">Par tranches</option>
                </select>
                @if (b.mode!=='paliers') { <label>{{ b.mode==='percent'?'%':'FCFA' }}</label><input type="number" [(ngModel)]="b.valeur" (ngModelChange)="enregistrerBareme(b)" /> }
              </div>
              @if (b.mode==='paliers') {
                <textarea rows="3" [ngModel]="paliersTxt(b)" (ngModelChange)="setPaliers(b,$event)" placeholder="25000:300&#10;100000:1000&#10;500000:2500"></textarea>
                <div class="hint">Une ligne par tranche : <b>montant_max:commission</b>. Au-delà de la dernière, on applique la dernière.</div>
              }
            </div>
          }
        }
      }
    }

    @if (modal()) {
      <div class="ov" (click)="fermer()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>➕ Nouvelle opération</h3>
          <div class="field"><label>Service</label><select [(ngModel)]="nService">@for (s of services; track s.id) { <option [value]="s.id">{{ s.label }}</option> }</select></div>
          <div class="field"><label>Type</label><div class="seg"><button [class.on]="nType==='envoi'" (click)="nType='envoi'">📤 Envoi</button><button [class.on]="nType==='retrait'" (click)="nType='retrait'">📥 Retrait</button></div></div>
          <div class="two"><div class="field"><label>Montant (FCFA)</label><input type="number" [(ngModel)]="nMontant" placeholder="150000" /></div><div class="field"><label>Destination</label><input [(ngModel)]="nDest" placeholder="France / Dakar..." /></div></div>
          <div class="two"><div class="field"><label>Client</label><input [(ngModel)]="nClient" placeholder="Nom" /></div><div class="field"><label>Téléphone</label><input [(ngModel)]="nTel" placeholder="77 ..." /></div></div>
          <div class="auto"><div class="l">Commission calculée</div><div class="v">{{ fcfa(commPreview()) }}</div><div class="x">barème {{ label(nService) }} · {{ nType==='envoi'?'Envoi':'Retrait' }}</div></div>
          @if (err()) { <div class="errm">{{ err() }}</div> }
          <div class="mrow"><button (click)="fermer()">Annuler</button><button class="save" [disabled]="busy()" (click)="enregistrer()">Enregistrer</button></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .h{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-bottom:14px}
    .ptitle{color:var(--ink);margin:0}.sub{color:var(--muted);font-size:12px}
    .period{border:1px solid var(--line);border-radius:9px;padding:8px 12px;font-size:13px;color:var(--ink);background:#fff}
    .tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
    .tabs button{border:1px solid var(--line);background:#fff;border-radius:99px;padding:7px 14px;cursor:pointer;color:var(--ink)}
    .tabs button.on{background:var(--ink);color:#fff;border-color:var(--ink);font-weight:700}
    .tabs .add{background:var(--gold);color:var(--ink);border-color:var(--gold);font-weight:700;margin-left:auto}
    .muted{color:var(--muted)}.small{font-size:12px}
    .kpis{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px}
    .kpi{flex:1;min-width:150px;background:#fff;border:1px solid var(--line);border-radius:13px;padding:13px}
    .kpi.hero{background:linear-gradient(135deg,var(--ink),var(--ink2,#244039));color:#fff;border:none}
    .kpi .l{font-size:11px;color:var(--muted)}.kpi.hero .l{color:#cfe0d9}
    .kpi .v{font-size:20px;font-weight:800;margin-top:2px}.kpi .v span{font-size:11px}
    .kpi .s{font-size:10px;color:var(--muted)}.kpi.hero .s{color:#cfe0d9}
    .secttl{font-size:13px;font-weight:700;margin:16px 0 10px;color:var(--ink)}
    .svc{display:flex;gap:12px;flex-wrap:wrap}
    .scard{flex:1;min-width:170px;background:#fff;border:1px solid var(--line);border-radius:13px;padding:13px;border-top:4px solid var(--gold)}
    .scard .nm{font-weight:800;font-size:13px;display:flex;justify-content:space-between;align-items:center}
    .scard .tag{font-size:9px;color:#fff;background:var(--ink);border-radius:99px;padding:2px 8px}
    .scard .ln{display:flex;justify-content:space-between;font-size:11.5px;padding:3px 0}
    .scard .comm{margin-top:8px;background:#E7F1EC;color:var(--ok);border-radius:8px;padding:6px;font-size:11px;font-weight:700;text-align:center}
    .months{background:#fff;border:1px solid var(--line);border-radius:13px;padding:12px}
    .mrow{display:flex;align-items:center;gap:10px;padding:6px 0}
    .ml{width:90px;font-size:12px;color:var(--ink);text-transform:capitalize}
    .bar{flex:1;height:10px;background:var(--bg);border-radius:99px;overflow:hidden}
    .fill{height:100%;background:var(--gold)}
    .mc{width:90px;text-align:right;font-weight:700;color:var(--ok);font-size:12px}
    .mn{width:54px;text-align:right;color:var(--muted);font-size:11px}
    .env{display:flex;align-items:center;gap:12px}
    .ei{width:36px;height:36px;border-radius:50%;background:#E7F1EC;display:flex;align-items:center;justify-content:center}
    .ec{flex:1}.e1{color:var(--ink);font-size:14px}.e2{color:var(--muted);font-size:12px}
    .ecom{color:var(--ok);font-weight:800}
    .filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
    .filters select,.filters input{border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:12px;color:var(--ink);background:#fff;font-family:inherit}
    .filters input{flex:1;min-width:160px}
    .jcard{background:#fff;border:1px solid var(--line);border-radius:13px;overflow:hidden}
    .scrollx{overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:12px;min-width:760px}
    th,td{text-align:left;padding:9px 12px}
    th{color:var(--muted);font-weight:600;font-size:10px;text-transform:uppercase;border-bottom:1px solid var(--line)}
    tbody tr{border-bottom:1px solid var(--line)}tbody tr:last-child{border-bottom:none}
    .pill{font-size:9px;font-weight:700;border-radius:99px;padding:2px 8px}
    .p-env{background:#E7F1EC;color:var(--ok)}.p-ret{background:#FBEEDD;color:var(--warn)}
    .comm2{color:var(--ok);font-weight:700}.del{color:var(--bad);border:none;background:none;cursor:pointer}
    .empty{padding:20px;text-align:center;color:var(--muted)}
    .bcard{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px}
    .bcard.ro{display:flex;justify-content:space-between;align-items:center}
    .val-ro{color:var(--ink);font-weight:700}
    .bcard .bh{margin-bottom:8px}.bcard .bh b{font-size:13px;color:var(--ink)}
    .brow{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .brow label{font-size:11px;color:var(--muted)}
    .brow select,.brow input,.bcard textarea{border:1px solid var(--line);border-radius:8px;padding:8px;font-size:12px;font-family:inherit}
    .bcard textarea{width:100%;margin-top:8px;resize:vertical}
    .hint{font-size:10px;color:var(--muted);margin-top:4px}
    .ov{position:fixed;inset:0;background:rgba(13,28,25,.5);display:flex;align-items:center;justify-content:center;padding:18px;z-index:60}
    .modal{background:#fff;border-radius:16px;max-width:460px;width:100%;padding:18px;max-height:90vh;overflow:auto}
    .modal h3{margin:0 0 14px}
    .field{margin-bottom:10px}.field label{display:block;font-size:10px;color:var(--muted);margin-bottom:4px}
    .field input,.field select{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px;font-size:13px;font-family:inherit}
    .two{display:flex;gap:10px}.two>div{flex:1}
    .seg{display:flex;gap:6px}.seg button{flex:1;border:1px solid var(--line);border-radius:9px;padding:10px;background:#fff;cursor:pointer;color:var(--ink)}
    .seg button.on{background:var(--ink);color:#fff;border-color:var(--ink);font-weight:700}
    .auto{margin-top:4px;background:#E7F1EC;border:1px dashed var(--ok);border-radius:10px;padding:11px;text-align:center}
    .auto .l{font-size:10px;color:var(--ok)}.auto .v{font-size:20px;font-weight:800;color:var(--ok)}.auto .x{font-size:9px;color:var(--muted)}
    .errm{color:var(--bad);margin-top:8px;font-size:13px}
    .mrow2{display:flex;gap:10px;margin-top:12px}
    .modal .mrow{display:flex;gap:10px;margin-top:12px}
    .modal .mrow button{flex:1;border-radius:10px;padding:11px;font-weight:700;cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--ink)}
    .modal .mrow .save{background:var(--gold);border-color:var(--gold)}
  `],
})
export class Transferts implements OnInit {
  services = [
    { id: 'western_union', label: 'Western Union', color: '#FFD200' },
    { id: 'ria', label: 'RIA', color: '#F58220' },
    { id: 'orange_money', label: 'Orange Money', color: '#FF7900' },
  ];
  fcfa = fcfa;
  tab = signal<Tab>('global');
  loading = signal(true);
  busy = signal(false);
  modal = signal(false);
  err = signal<string | null>(null);

  private _all = signal<any[]>([]);
  baremes = signal<any[]>([]);
  mois = new Date().toISOString().slice(0, 7);

  fService = ''; fType = ''; fQ = '';
  nService = 'western_union'; nType: 'envoi' | 'retrait' = 'envoi';
  nMontant: number | null = null; nDest = ''; nClient = ''; nTel = '';

  constructor(private api: Api, private auth: AuthService) {}

  canWrite() { return this.auth.role() === 'admin'; } // seul l'agent ecrit

  async ngOnInit() { await this.loadBaremes(); await this.charger(); }
  async loadBaremes() { try { this.baremes.set(await this.api.get('/baremes')); } catch {} }
  async charger() {
    this.loading.set(true);
    try { this._all.set(await this.api.get('/transferts')); }
    finally { this.loading.set(false); }
  }

  all() { return this._all(); }
  ops() { return this._all().filter(o => (o.created_at || '').slice(0, 7) === this.mois); }
  envois() { return this.ops().filter(o => o.type === 'envoi'); }
  filtres() {
    return this.ops().filter(o =>
      (!this.fService || o.service === this.fService) &&
      (!this.fType || o.type === this.fType) &&
      (!this.fQ || (o.client || '').toLowerCase().includes(this.fQ.toLowerCase())));
  }
  label(id: string) { return this.services.find(s => s.id === id)?.label || id; }
  date(d: string) { const x = new Date(d); return isNaN(+x) ? '' : x.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }

  totEnvoi(list: any[]) { return list.filter(o => o.type === 'envoi').reduce((s, o) => s + Number(o.montant), 0); }
  totRetrait(list: any[]) { return list.filter(o => o.type === 'retrait').reduce((s, o) => s + Number(o.montant), 0); }
  totComm(list: any[]) { return list.reduce((s, o) => s + Number(o.commission), 0); }
  nb(list: any[], id: string) { return list.filter(o => o.service === id).length; }
  sumSvc(list: any[], id: string, type: string) { return list.filter(o => o.service === id && o.type === type).reduce((s, o) => s + Number(o.montant), 0); }
  commSvc(list: any[], id: string) { return list.filter(o => o.service === id).reduce((s, o) => s + Number(o.commission), 0); }

  parMois() {
    const map = new Map<string, { commission: number; n: number }>();
    this._all().forEach(o => {
      const k = (o.created_at || '').slice(0, 7); if (!k) return;
      const e = map.get(k) || { commission: 0, n: 0 };
      e.commission += Number(o.commission); e.n += 1; map.set(k, e);
    });
    const arr = [...map.entries()].map(([mois, v]) => ({ mois, ...v, label: this.moisTxt(mois), pct: 0 }));
    arr.sort((a, b) => b.mois.localeCompare(a.mois));
    const max = Math.max(1, ...arr.map(a => a.commission));
    arr.forEach(a => a.pct = Math.round(a.commission / max * 100));
    return arr.slice(0, 12);
  }
  moisTxt(m: string) { const [y, mo] = m.split('-'); const d = new Date(Number(y), Number(mo) - 1, 1); return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }); }
  moisLabel() { return this.moisTxt(this.mois); }

  titre() { return { global: 'Services de transfert', stats: 'Statistiques', envois: 'Envois', journal: 'Journal des opérations', baremes: 'Barèmes de commission' }[this.tab()]; }
  sousTitre() {
    const obs = this.canWrite() ? '' : ' — observation (super admin)';
    return ({ global: 'Vue globale du mois' + obs, stats: 'Tout l\'historique' + obs, envois: '« envoi à un tel »' + obs, journal: 'Toutes les opérations (filtrable)' + obs, baremes: this.canWrite() ? 'Modifiable par l\'agent' : 'Lecture seule' })[this.tab()];
  }
  moisOptions() {
    const out: any[] = []; const now = new Date();
    for (let i = 0; i < 12; i++) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push({ v: d.toISOString().slice(0, 7), l: this.moisTxt(d.toISOString().slice(0, 7)) }); }
    return out;
  }

  commPreview() { const b = this.baremes().find(x => x.service === this.nService && x.type === this.nType); return this.calc(b, Number(this.nMontant) || 0); }
  calc(b: any, m: number) {
    if (!b || !m) return 0;
    if (b.mode === 'percent') return Math.round(m * Number(b.valeur) / 100);
    if (b.mode === 'fixe') return Number(b.valeur) || 0;
    const ps = (b.paliers || []).slice().sort((a: any, c: any) => a.max - c.max);
    for (const p of ps) if (m <= Number(p.max)) return Number(p.comm) || 0;
    return ps.length ? Number(ps[ps.length - 1].comm) || 0 : 0;
  }

  ouvrir() { this.err.set(null); this.nMontant = null; this.nDest = ''; this.nClient = ''; this.nTel = ''; this.modal.set(true); }
  fermer() { this.modal.set(false); }
  async enregistrer() {
    if (!this.nMontant) { this.err.set('Saisis un montant.'); return; }
    this.busy.set(true);
    try { await this.api.post('/transferts', { type: this.nType, service: this.nService, montant: this.nMontant, client: this.nClient, telephone: this.nTel, destination: this.nDest }); this.modal.set(false); await this.charger(); }
    catch (e: any) { this.err.set(e?.error?.message || 'Enregistrement impossible.'); }
    finally { this.busy.set(false); }
  }
  async supprimer(o: any) { await this.api.del('/transferts/' + o.id); await this.charger(); }

  baremeTxt(b: any) { return b.mode === 'percent' ? (b.valeur + ' %') : (b.mode === 'fixe' ? fcfa(b.valeur) : 'paliers : ' + (b.paliers || []).map((p: any) => p.max + '→' + p.comm).join(', ')); }
  paliersTxt(b: any) { return (b.paliers || []).map((p: any) => p.max + ':' + p.comm).join('\n'); }
  setPaliers(b: any, txt: string) { b.paliers = txt.split('\n').map(l => { const p = l.split(':'); return { max: Number(p[0]) || 0, comm: Number(p[1]) || 0 }; }).filter(p => p.max > 0); this.enregistrerBareme(b); }
  onMode(b: any) {
    if (b.mode === 'paliers' && (!b.paliers || !b.paliers.length)) b.paliers = [{ max: 25000, comm: 300 }, { max: 100000, comm: 1000 }];
    if (b.mode !== 'paliers' && (b.valeur === null || b.valeur === undefined)) b.valeur = b.mode === 'percent' ? 1 : 500;
    this.enregistrerBareme(b);
  }
  async enregistrerBareme(b: any) { try { await this.api.put('/baremes', { service: b.service, type: b.type, mode: b.mode, valeur: b.valeur ?? null, paliers: b.paliers ?? null }); } catch {} }
}