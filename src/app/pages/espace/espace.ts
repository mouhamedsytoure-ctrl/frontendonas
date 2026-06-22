import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Api, fcfa } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-espace',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  template: `
    <header class="top">
      <a class="brandbox" (click)="apropos()"><img [src]="logo" alt="SITS"/></a>
      <div class="me">{{ auth.user()?.name }} <button class="lo" (click)="logout()">Déconnexion</button></div>
    </header>

    <nav class="tabs">
      <button [class.on]="tab()==='accueil'" (click)="tab.set('accueil')">Accueil</button>
      <button [class.on]="tab()==='contrat'" (click)="tab.set('contrat')">Contrat</button>
      <button [class.on]="tab()==='paiements'" (click)="tab.set('paiements')">Paiements</button>
      <button [class.on]="tab()==='reclam'" (click)="tab.set('reclam')">Réclamations</button>
    </nav>

    <div class="wrap">
      @if (loading()) { <p class="muted">Chargement...</p> }
      @else if (!contrat()) { <div class="card"><p>Aucun contrat actif n'est associé à votre compte.</p></div> }
      @else {
        <!-- ACCUEIL -->
        @if (tab()==='accueil') {
          <div class="hero">
            <div class="hero-top">
              <span class="h-lbl">Loyer — {{ periode }}</span>
              <span class="statut-pill" [style.background]="paye() ? 'var(--ok)' : 'var(--gold)'" [style.color]="paye() ? '#fff' : 'var(--ink)'">{{ paye() ? 'Payé' : 'À payer' }}</span>
            </div>
            <div class="h-val">{{ fcfa(contrat().montant_loyer) }} <span>FCFA</span></div>
            <div class="h-log">{{ logementLabel() }}</div>
            <div class="statut">{{ paye() ? '✓ Loyer du mois payé' : echeanceTxt() }}</div>
          </div>

          <div class="grid2">
            <div class="card kpi"><div class="k-ic">📅</div><div><div class="k-v">{{ moisRestants() }}</div><div class="k-l">Fin du bail</div><div class="k-s">reste {{ joursRestants() }} j</div></div></div>
            <div class="card kpi"><div class="k-ic">🐖</div><div><div class="k-v">{{ fcfa(totalPaye()) }}</div><div class="k-l">Total payé</div><div class="k-s">FCFA cumulés</div></div></div>
          </div>

          @if (!paye()) {
            @if (!choixPaye()) {
              <button class="btn btn-gold full" (click)="choixPaye.set(true)">Payer mon loyer</button>
            } @else {
              <div class="card">
                <p class="pp">Choisir le moyen de paiement :</p>
                <div class="modes">
                  <button class="mode" [disabled]="busy()" (click)="payer('wave')">Wave</button>
                  <button class="mode" [disabled]="busy()" (click)="payer('orange_money')">Orange Money</button>
                </div>
                <button class="lien" (click)="choixPaye.set(false)">Annuler</button>
              </div>
            }
          }
          @if (msg()) { <div class="ok">{{ msg() }}</div> }

          <!-- Mon contrat (resume) -->
          <div class="card">
            <h3>Mon contrat</h3>
            <div class="row"><span>Logement</span><b>{{ logementLabel() }}</b></div>
            <div class="row"><span>Caution</span><b>{{ fcfa(contrat().caution) }} FCFA</b></div>
            <div class="row"><span>Échéance</span><b>le {{ contrat().jour_echeance }} de chaque mois</b></div>
            <div class="row"><span>Période</span><b>{{ contrat().date_debut | slice:0:10 }} → {{ contrat().date_fin | slice:0:10 }}</b></div>
          </div>

          <!-- Dernier paiement -->
          @if (dernierPaiement(); as dp) {
            <div class="card derp">
              <div class="derp-ic">🧾</div>
              <div class="derp-c">
                <div class="derp-t">Dernier paiement</div>
                <div class="derp-m">{{ dp.periode }} · {{ fcfa(dp.montant) }} FCFA</div>
                <div class="derp-r">Reçu : {{ dp.recu_numero }}</div>
              </div>
              @if (dp.statut === 'paye') { <button class="lien2" [disabled]="busy()" (click)="quittance(dp.id)">PDF</button> }
            </div>
          }

          <!-- Raccourcis -->
          <div class="grid2">
            <button class="rac" [disabled]="busy()" (click)="pdfContrat()"><div class="rac-ic">📄</div>Mon contrat</button>
            <button class="rac" (click)="tab.set('reclam')"><div class="rac-ic">🛠</div>Réclamation</button>
          </div>
        }

        <!-- CONTRAT -->
        @if (tab()==='contrat') {
          <div class="card">
            <h3>Mon contrat</h3>
            <div class="row"><span>Logement</span><b>{{ contrat().logement?.immeuble?.nom }} — {{ contrat().logement?.reference }}</b></div>
            <div class="row"><span>Loyer</span><b>{{ fcfa(contrat().montant_loyer) }} FCFA</b></div>
            <div class="row"><span>Début</span><b>{{ contrat().date_debut | slice:0:10 }}</b></div>
            <div class="row"><span>Fin</span><b>{{ contrat().date_fin | slice:0:10 }}</b></div>
            <div class="row"><span>Échéance</span><b>le {{ contrat().jour_echeance }} de chaque mois</b></div>
            <button class="btn btn-ink full" [disabled]="busy()" (click)="pdfContrat()">📄 Télécharger mon contrat (PDF)</button>
          </div>
        }

        <!-- PAIEMENTS -->
        @if (tab()==='paiements') {
          <div class="card">
            <h3>Mes paiements</h3>
            @if (paiements().length===0) { <p class="muted">Aucun paiement.</p> }
            @for (p of paiements(); track p.id) {
              <div class="row pay">
                <div><b>{{ p.periode }}</b><div class="muted">{{ p.mode_paiement }} · {{ p.statut }}</div></div>
                <div class="r">
                  <b>{{ fcfa(p.montant) }} FCFA</b>
                  @if (p.statut==='paye') { <button class="lien" [disabled]="busy()" (click)="quittance(p.id)">Reçu</button> }
                </div>
              </div>
            }
          </div>
        }

        <!-- RECLAMATIONS -->
        @if (tab()==='reclam') {
          <div class="card">
            <h3>Nouvelle réclamation</h3>
            <input class="input" placeholder="Objet" [(ngModel)]="rObjet" />
            <textarea class="input" rows="3" placeholder="Décrivez le problème" [(ngModel)]="rDesc"></textarea>
            <select class="input" [(ngModel)]="rPrio">
              <option value="basse">Priorité basse</option>
              <option value="normale">Priorité normale</option>
              <option value="haute">Priorité haute</option>
            </select>
            <button class="btn btn-ink full" [disabled]="busy()" (click)="envoyerReclam()">Envoyer</button>
            @if (msg()) { <div class="ok" [style.background]="msgErr() ? '#FBE3E0' : '#E7F1EC'" [style.color]="msgErr() ? 'var(--bad)' : 'var(--ok)'">{{ msg() }}</div> }
          </div>
          <div class="card">
            <h3>Mes réclamations</h3>
            @if (reclams().length===0) { <p class="muted">Aucune réclamation.</p> }
            @for (r of reclams(); track r.id) {
              <div class="row"><div><b>{{ r.objet }}</b><div class="muted">priorité {{ r.priorite }}</div></div>
                <span class="badge">{{ r.statut }}</span></div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:var(--bg)}
    .top{display:flex;justify-content:space-between;align-items:center;background:var(--ink);color:#fff;padding:12px 18px}
    .brandbox{background:#fff;border-radius:8px;padding:5px 10px;cursor:pointer}.brandbox img{height:26px;display:block}
    .me{font-size:14px;display:flex;align-items:center;gap:12px}
    .lo{background:none;border:1px solid #ffffff55;color:#fff;border-radius:8px;padding:5px 10px;cursor:pointer}
    .tabs{display:flex;gap:6px;overflow:auto;background:var(--ink);padding:0 12px 12px}
    .tabs button{border:none;background:#ffffff22;color:#fff;border-radius:99px;padding:7px 14px;cursor:pointer;white-space:nowrap}
    .tabs button.on{background:var(--gold);color:var(--ink);font-weight:700}
    .wrap{max-width:760px;margin:0 auto;padding:18px 16px}
    .muted{color:var(--muted)}
    .hero{background:linear-gradient(135deg,var(--ink),var(--ink2,#244039));color:#fff;border-radius:18px;padding:22px}
    .h-lbl{opacity:.8} .h-val{font-size:30px;font-weight:bold} .h-val span{font-size:16px;opacity:.8}
    .statut{display:inline-block;margin-top:12px;padding:6px 14px;border-radius:99px;font-weight:700}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}
    .kpi .k-l{color:var(--muted);font-size:13px}.kpi .k-v{color:var(--ink);font-weight:bold;font-size:18px}.kpi .k-s{color:var(--muted);font-size:12px}
    .full{width:100%;margin-top:8px}
    h3{color:var(--ink);margin:0 0 12px}
    .row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-top:1px solid var(--line)}
    .row:first-of-type{border-top:none}.row span{color:var(--muted)}.row b{color:var(--ink)}
    .row .r{display:flex;align-items:center;gap:10px}
    .pp{color:var(--ink);font-weight:600}
    .modes{display:flex;gap:10px}.mode{flex:1;padding:14px;border:2px solid var(--gold);background:#fff;border-radius:12px;font-weight:700;color:var(--ink);cursor:pointer}
    .lien{background:none;border:none;color:var(--gold);font-weight:600;cursor:pointer;margin-top:10px}
    .ok{background:#E7F1EC;color:var(--ok);padding:12px;border-radius:12px;margin-top:12px}
    .badge{background:var(--bg);border:1px solid var(--line);border-radius:99px;padding:3px 10px;font-size:12px;color:var(--ink)}
    textarea.input{resize:vertical}

    .hero-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
    .statut-pill{font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px}
    .h-log{color:#cfe0d9;font-size:13px;margin:2px 0 8px}
    .kpi{display:flex;gap:10px;align-items:center}
    .k-ic{font-size:22px}
    .derp{display:flex;align-items:center;gap:12px}
    .derp-ic{width:40px;height:40px;border-radius:10px;background:#E7F1EC;display:flex;align-items:center;justify-content:center;font-size:18px}
    .derp-c{flex:1}.derp-t{color:var(--muted);font-size:12px}.derp-m{color:var(--ink);font-weight:700}.derp-r{color:var(--muted);font-size:11px}
    .lien2{background:none;border:1px solid var(--gold);color:var(--ink);border-radius:8px;padding:6px 10px;font-weight:700;cursor:pointer}
    .rac{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;font-weight:700;color:var(--ink);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px}
    .rac-ic{font-size:22px}
  `],
})
export class Espace implements OnInit {
  logo = environment.apiUrl.replace('/api', '') + '/logo-toursen.jpeg';
  tab = signal<'accueil' | 'contrat' | 'paiements' | 'reclam'>('accueil');
  loading = signal(true);
  busy = signal(false);
  choixPaye = signal(false);
  msg = signal<string | null>(null);
  msgErr = signal(false);

  private _contrat = signal<any>(null);
  private _paiements = signal<any[]>([]);
  periode = '';
  private _paye = signal(false);
  reclams = signal<any[]>([]);

  rObjet = ''; rDesc = ''; rPrio = 'normale';
  fcfa = fcfa;

  constructor(private api: Api, private http: HttpClient, public auth: AuthService) {}

  async ngOnInit() { await this.charger(); await this.chargerReclams(); }

  contrat() { return this._contrat(); }
  paiements() { return this._paiements(); }
  paye() { return this._paye(); }

  async charger() {
    this.loading.set(true);
    try {
      const d: any = await this.api.get('/locataire/contrat');
      this._contrat.set(d.contrat);
      this._paiements.set(d.paiements || []);
      this.periode = d.periode;
      this._paye.set(!!d.paye_ce_mois);
    } finally { this.loading.set(false); }
  }
  async chargerReclams() { try { this.reclams.set(await this.api.get('/reclamations')); } catch {} }

  totalPaye() { return this._paiements().filter(p => p.statut === 'paye').reduce((s, p) => s + Number(p.montant || 0), 0); }
  moisRestants() {
    const f = new Date(this._contrat()?.date_fin); if (isNaN(+f)) return '—';
    const m = Math.max(0, Math.round((+f - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
    return m + ' mois';
  }
  joursRestants() {
    const f = new Date(this._contrat()?.date_fin); if (isNaN(+f)) return 0;
    return Math.max(0, Math.round((+f - Date.now()) / (1000 * 60 * 60 * 24)));
  }
  logementLabel() {
    const lg = this._contrat()?.logement; const im = lg?.immeuble;
    return lg ? `${im?.nom || ''} - ${lg.reference || ''}`.trim() : '—';
  }
  dernierPaiement() {
    const list = this._paiements().filter(p => p.statut === 'paye');
    return list.length ? list[0] : (this._paiements()[0] || null);
  }
  echeanceTxt() {
    const j = this._contrat()?.jour_echeance || 5;
    const now = new Date(); const d = now.getDate();
    const reste = d <= j ? (j - d) : 0;
    return reste > 0 ? `Il vous reste ${reste} jour(s) pour payer` : 'Loyer à payer';
  }

  async payer(mode: string) {
    this.busy.set(true); this.msg.set(null);
    try {
      await this.api.post('/locataire/payer', { mode_paiement: mode });
      this.choixPaye.set(false);
      this.msg.set('Paiement effectué ✓');
      await this.charger();
    } catch (e: any) {
      this.msg.set(e?.error?.message || 'Paiement impossible.');
    } finally { this.busy.set(false); }
  }

  async pdfContrat() {
    this.busy.set(true);
    try {
      const blob = await firstValueFrom(this.http.get(`${environment.apiUrl}/contrats/${this._contrat().id}/pdf`, { responseType: 'blob' }));
      window.open(URL.createObjectURL(blob as Blob), '_blank');
    } finally { this.busy.set(false); }
  }
  async quittance(id: number) {
    this.busy.set(true);
    try {
      const blob = await firstValueFrom(this.http.get(`${environment.apiUrl}/paiements/${id}/quittance`, { responseType: 'blob' }));
      window.open(URL.createObjectURL(blob as Blob), '_blank');
    } finally { this.busy.set(false); }
  }

  async envoyerReclam() {
    this.msg.set(null); this.msgErr.set(false);
    if (!this.rObjet.trim()) { this.msgErr.set(true); this.msg.set('Veuillez saisir un objet.'); return; }
    this.busy.set(true);
    try {
      await this.api.post('/reclamations', {
        objet: this.rObjet, description: this.rDesc, priorite: this.rPrio,
        logement_id: this._contrat()?.logement_id ?? this._contrat()?.logement?.id,
      });
      this.rObjet = ''; this.rDesc = ''; this.rPrio = 'normale';
      this.msgErr.set(false); this.msg.set('Réclamation envoyée ✓');
      await this.chargerReclams();
    } catch (e: any) {
      this.msgErr.set(true);
      this.msg.set(e?.error?.message || e?.error?.errors?.priorite?.[0] || 'Envoi impossible.');
    } finally { this.busy.set(false); }
  }

  apropos() { window.location.href = '/apropos'; }
  logout() { this.auth.logout(); window.location.href = '/login'; }
}
