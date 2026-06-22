import { Component, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-immeubles',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="head">
      <h1 class="ptitle">Immeubles</h1>
      @if (admin()) { <button class="add" (click)="ouvrir()">+ Nouvel immeuble</button> }
    </div>

    @if (loading()) { <p class="muted">Chargement...</p> }
    @else if (error()) { <div class="card err">{{ error() }}</div> }
    @else if (items().length === 0) { <p class="muted">Aucun immeuble. @if (admin()) { Clique « + Nouvel immeuble » pour en créer un. } </p> }
    @else {
      <div class="grid">
        @for (im of items(); track im.id) {
          <a class="imcard" [routerLink]="['/app/immeubles', im.id]">
            @if (cover(im); as c) { <img [src]="c" alt=""/> } @else { <div class="noimg">🏢</div> }
            <div class="ov">
              <div class="nm">{{ im.nom }}</div>
              <div class="vl">{{ im.ville }}</div>
            </div>
          </a>
        }
      </div>
    }

    @if (modal()) {
      <div class="bg" (click)="fermer()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Nouvel immeuble</h3>
          <div class="field"><label>Nom *</label><input [(ngModel)]="nNom" placeholder="Ex: Résidence Médina" /></div>
          <div class="field"><label>Ville *</label><input [(ngModel)]="nVille" placeholder="Ex: Dakar" /></div>
          <div class="field"><label>Adresse</label><input [(ngModel)]="nAdresse" placeholder="Quartier, rue..." /></div>
          <div class="field"><label>Description</label><textarea rows="2" [(ngModel)]="nDesc" placeholder="(facultatif)"></textarea></div>
          @if (err2()) { <div class="errm">{{ err2() }}</div> }
          <div class="row2">
            <button class="btn ghost" (click)="fermer()">Annuler</button>
            <button class="btn gold" [disabled]="busy()" (click)="creer()">Créer</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:10px;flex-wrap:wrap}
    .ptitle{color:var(--ink);margin:0}
    .add{background:var(--gold);color:var(--ink);border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer}
    .muted{color:var(--muted)} .err{color:var(--bad)}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
    .imcard{position:relative;height:160px;border-radius:16px;overflow:hidden;text-decoration:none;background:var(--ink);display:block}
    .imcard img{width:100%;height:100%;object-fit:cover}
    .noimg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;color:#fff;background:var(--ink)}
    .ov{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:14px;background:linear-gradient(to bottom,transparent,rgba(0,0,0,.75))}
    .nm{color:#fff;font-weight:bold;font-size:17px} .vl{color:#cfe0d9;font-size:13px}
    .bg{position:fixed;inset:0;background:rgba(13,28,25,.5);display:flex;align-items:center;justify-content:center;padding:18px;z-index:60}
    .modal{background:#fff;border-radius:16px;max-width:440px;width:100%;padding:18px}
    .modal h3{margin:0 0 14px;color:var(--ink)}
    .field{margin-bottom:10px}.field label{display:block;font-size:11px;color:var(--muted);margin-bottom:4px}
    .field input,.field textarea{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px;font-size:14px;font-family:inherit}
    .errm{color:var(--bad);font-size:13px;margin-bottom:6px}
    .row2{display:flex;gap:10px;margin-top:8px}
    .btn{flex:1;border-radius:10px;padding:11px;font-weight:700;cursor:pointer;border:1px solid var(--line)}
    .ghost{background:#fff;color:var(--ink)} .gold{background:var(--gold);border-color:var(--gold);color:var(--ink)}
  `],
})
export class Immeubles implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  modal = signal(false);
  busy = signal(false);
  err2 = signal<string | null>(null);
  nNom = ''; nVille = ''; nAdresse = ''; nDesc = '';

  constructor(private api: Api, private auth: AuthService, private router: Router) {}
  admin() { const r = this.auth.role(); return r === 'admin' || r === 'super_admin'; }

  async ngOnInit() { await this.charger(); }
  async charger() {
    this.loading.set(true);
    try { this.items.set(await this.api.get('/immeubles')); this.error.set(null); }
    catch (e: any) { this.error.set(e?.error?.message || 'Erreur de chargement.'); }
    finally { this.loading.set(false); }
  }
  cover(im: any): string | null {
    if (im.photo_couverture_url) return im.photo_couverture_url;
    const m = (im.medias || []).find((x: any) => x.type === 'photo' && x.url);
    return m?.url || null;
  }

  ouvrir() { this.err2.set(null); this.nNom = ''; this.nVille = ''; this.nAdresse = ''; this.nDesc = ''; this.modal.set(true); }
  fermer() { this.modal.set(false); }
  async creer() {
    if (!this.nNom.trim() || !this.nVille.trim()) { this.err2.set('Le nom et la ville sont obligatoires.'); return; }
    this.busy.set(true);
    try {
      const im: any = await this.api.post('/immeubles', { nom: this.nNom, ville: this.nVille, adresse: this.nAdresse, description: this.nDesc });
      this.modal.set(false);
      // aller direct sur la page de l'immeuble pour ajouter les photos / appartements
      this.router.navigate(['/app/immeubles', im.id]);
    } catch (e: any) { this.err2.set(e?.error?.message || 'Création impossible.'); }
    finally { this.busy.set(false); }
  }
}
