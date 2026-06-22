import { SlicePipe } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Api, fcfa } from '../../core/api.service';

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  template: `
    <a routerLink="/app/contrats" class="back">← Contrats</a>
    @if (loading()) { <p class="muted">Chargement...</p> }
    @else if (c(); as ct) {
      <h1 class="ptitle">{{ nom(ct) }}</h1>
      <div class="badges">
        <span class="badge" [style.background]="bg(ct)" [style.color]="fg(ct)">{{ ct.statut }}</span>
        @if (ct.est_bloque) { <span class="badge warn">Bloqué</span> }
        @if (ct.archived_at) { <span class="badge muted2">Archivé</span> }
      </div>

      <div class="card grid2">
        <div><span>Logement</span><b>{{ logement(ct) }}</b></div>
        <div><span>Téléphone</span><b>{{ ct.preneur_telephone || '—' }}</b></div>
        <div><span>Email</span><b>{{ ct.preneur_email || '—' }}</b></div>
        <div><span>Adresse</span><b>{{ ct.preneur_adresse || '—' }}</b></div>
        <div><span>Profession</span><b>{{ ct.preneur_profession || '—' }}</b></div>
        <div><span>Nationalité</span><b>{{ ct.preneur_nationalite || '—' }}</b></div>
        <div><span>Pièce</span><b>{{ ct.preneur_piece_type }} {{ ct.preneur_piece_numero }}</b></div>
        <div><span>Loyer</span><b>{{ fcfa(ct.montant_loyer) }} FCFA</b></div>
        <div><span>Période</span><b>{{ ct.date_debut | slice:0:10 }} → {{ ct.date_fin | slice:0:10 }}</b></div>
      </div>

      <div class="actions">
        <button class="btn btn-ink" (click)="voirTexte()">Voir le texte</button>
        <button class="btn btn-gold" (click)="imprimer()">Imprimer / Enregistrer en PDF</button>
      </div>

      @if (piece(); as p) { <h3>Pièce d'identité</h3> <img class="doc" [src]="p" alt=""/> }
      @if (sign(); as s) { <h3>Signature</h3> <img class="sig" [src]="s" alt=""/> }

      @if (!ct.archived_at) {
        <h3>Gestion</h3>
        <div class="actions">
          @if (ct.statut !== 'resilie') { <button class="btn ghost" (click)="action('resilier','Résilier ce contrat ?')">Résilier</button> }
          @if (!ct.est_bloque) { <button class="btn ghost" (click)="action('bloquer','Bloquer ce contrat ?')">Bloquer</button> }
          <button class="btn ghost" (click)="action('archiver','Archiver ce contrat ?')">Archiver</button>
        </div>
      }

      @if (texte()) {
        <div class="modal" (click)="texte.set(null)">
          <div class="sheet" (click)="$event.stopPropagation()">
            <pre>{{ texte() }}</pre>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .back{color:var(--ink);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:10px}
    .ptitle{color:var(--ink);margin:6px 0} .muted{color:var(--muted)}
    .badges{display:flex;gap:8px;margin-bottom:14px}
    .warn{background:#FBEEDD;color:var(--warn)} .muted2{background:#eee;color:var(--muted)}
    .grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
    .grid2 div{display:flex;flex-direction:column} .grid2 span{color:var(--muted);font-size:12px} .grid2 b{color:var(--ink)}
    .actions{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
    .ghost{background:#fff;border:1px solid var(--ink);color:var(--ink)}
    h3{color:var(--ink);margin:18px 0 8px}
    .doc{max-width:340px;border-radius:12px;border:1px solid var(--line)}
    .sig{max-width:240px;background:#fff;border:1px solid var(--line);border-radius:8px}
    .modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px}
    .sheet{background:#fff;border-radius:14px;max-width:760px;width:100%;max-height:85vh;overflow:auto;padding:20px}
    pre{white-space:pre-wrap;font-family:inherit;font-size:13.5px;line-height:1.55;color:var(--ink);margin:0}
  `],
})
export class ContratDetail implements OnInit {
  c = signal<any>(null);
  texte = signal<string | null>(null);
  loading = signal(true);
  fcfa = fcfa;
  constructor(private api: Api, private route: ActivatedRoute, private http: HttpClient) {}
  async ngOnInit() { await this.load(); }
  async load() {
    const id = this.route.snapshot.paramMap.get('id');
    this.loading.set(true);
    try { this.c.set(await this.api.get('/contrats/' + id)); }
    finally { this.loading.set(false); }
  }
  async voirTexte() {
    const r: any = await this.api.get('/contrats/' + this.c().id + '/texte');
    this.texte.set(r.texte);
  }
  async imprimer() {
    const blob = await firstValueFrom(
      this.http.get(`${environment.apiUrl}/contrats/${this.c().id}/pdf`, { responseType: 'blob' })
    );
    const url = URL.createObjectURL(blob as Blob);
    window.open(url, '_blank');
  }
  async action(chemin: string, msg: string) {
    if (!confirm(msg)) return;
    await this.api.put('/contrats/' + this.c().id + '/' + chemin, {});
    await this.load();
  }
  nom(c: any) { return `${c.preneur_prenom || ''} ${c.preneur_nom || ''}`.trim() || 'Contrat'; }
  logement(c: any) { const lg = c.logement; const im = lg?.immeuble; return lg ? `${im?.nom || ''} - ${lg.reference || ''}` : '—'; }
  piece(): string | null { const m = (this.c()?.medias || []).find((x: any) => x.libelle === 'piece_identite' && x.url); return m?.url || null; }
  sign(): string | null { const m = (this.c()?.medias || []).find((x: any) => x.libelle === 'signature' && x.url); return m?.url || null; }
  bg(c: any) { return c.statut === 'resilie' ? '#FBE3E0' : (c.est_bloque ? '#FBEEDD' : '#E7F1EC'); }
  fg(c: any) { return c.statut === 'resilie' ? 'var(--bad)' : (c.est_bloque ? 'var(--warn)' : 'var(--ok)'); }
}
