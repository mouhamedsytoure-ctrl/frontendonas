import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, fcfa } from '../../core/api.service';

@Component({
  selector: 'app-terrains',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="head"><h1 class="ptitle">Terrains</h1><button class="btn btn-ink" (click)="show.set(true)">+ Ajouter</button></div>
    @if (loading()) { <p class="muted">Chargement...</p> }
    @else if (items().length === 0) { <p class="muted">Aucun terrain.</p> }
    @else {
      @for (t of items(); track t.id) {
        <div class="card row">
          <div><div class="nm">{{ t.nom || t.reference || 'Terrain' }}</div><div class="sub">{{ t.ville || t.adresse || '' }} @if (t.superficie) { · {{ t.superficie }} m² }</div></div>
          @if (t.prix) { <b>{{ fcfa(t.prix) }} FCFA</b> }
        </div>
      }
    }
    @if (show()) {
      <div class="modal" (click)="show.set(false)">
        <div class="sheet" (click)="$event.stopPropagation()">
          <h3>Nouveau terrain</h3>
          <input class="input" placeholder="Nom / référence" [(ngModel)]="form.nom"/>
          <input class="input" placeholder="Ville" [(ngModel)]="form.ville"/>
          <input class="input" placeholder="Superficie (m²)" type="number" [(ngModel)]="form.superficie"/>
          <input class="input" placeholder="Prix (FCFA)" type="number" [(ngModel)]="form.prix"/>
          @if (err()) { <div class="e">{{ err() }}</div> }
          <div class="actions"><button class="btn ghost" (click)="show.set(false)">Annuler</button><button class="btn btn-ink" (click)="save()">Enregistrer</button></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
    .ptitle{color:var(--ink);margin:0} .muted{color:var(--muted)}
    .row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
    .nm{font-weight:600;color:var(--ink)}.sub{color:var(--muted);font-size:13px}
    .modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px}
    .sheet{background:#fff;border-radius:14px;max-width:420px;width:100%;padding:20px}
    .sheet h3{margin:0 0 12px;color:var(--ink)} .sheet .input{margin-bottom:10px}
    .actions{display:flex;gap:10px;justify-content:flex-end;margin-top:8px}
    .ghost{background:#fff;border:1px solid var(--ink);color:var(--ink)} .e{color:var(--bad);margin-bottom:8px}
  `],
})
export class Terrains implements OnInit {
  items = signal<any[]>([]); loading = signal(true); show = signal(false); err = signal<string | null>(null);
  form: any = { nom: '', ville: '', superficie: null, prix: null };
  fcfa = fcfa;
  constructor(private api: Api) {}
  async ngOnInit() { await this.load(); }
  async load() { this.loading.set(true); try { this.items.set(await this.api.get('/terrains')); } finally { this.loading.set(false); } }
  async save() {
    this.err.set(null);
    try { await this.api.post('/terrains', this.form); this.show.set(false); this.form = { nom: '', ville: '', superficie: null, prix: null }; await this.load(); }
    catch (e: any) { this.err.set(e?.error?.message || 'Erreur. Vérifiez les champs requis.'); }
  }
}
