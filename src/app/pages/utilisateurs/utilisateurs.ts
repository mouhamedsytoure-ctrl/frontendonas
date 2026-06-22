import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api.service';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="head"><h1 class="ptitle">Utilisateurs (admins)</h1><button class="btn btn-ink" (click)="show.set(true)">+ Nouvel admin</button></div>
    @if (loading()) { <p class="muted">Chargement...</p> }
    @else if (items().length === 0) { <p class="muted">Aucun administrateur.</p> }
    @else {
      @for (u of items(); track u.id) {
        <div class="card row">
          <div class="av">{{ ini(u.name) }}</div>
          <div class="info"><div class="nm">{{ u.name }}</div><div class="sub">{{ u.email }} · {{ u.telephone || '—' }}</div></div>
          <span class="badge" [style.background]="u.is_active ? '#E7F1EC':'#FBE3E0'" [style.color]="u.is_active ? 'var(--ok)':'var(--bad)'">{{ u.is_active ? 'Actif':'Inactif' }}</span>
        </div>
      }
    }
    @if (show()) {
      <div class="modal" (click)="show.set(false)">
        <div class="sheet" (click)="$event.stopPropagation()">
          <h3>Nouvel administrateur</h3>
          <input class="input" placeholder="Nom complet" [(ngModel)]="form.name"/>
          <input class="input" placeholder="Email" [(ngModel)]="form.email"/>
          <input class="input" placeholder="Téléphone" [(ngModel)]="form.telephone"/>
          <input class="input" placeholder="Mot de passe" type="password" [(ngModel)]="form.password"/>
          @if (err()) { <div class="e">{{ err() }}</div> }
          <div class="actions"><button class="btn ghost" (click)="show.set(false)">Annuler</button><button class="btn btn-ink" (click)="save()">Créer</button></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
    .ptitle{color:var(--ink);margin:0} .muted{color:var(--muted)}
    .row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
    .av{width:42px;height:42px;border-radius:50%;background:var(--gold);color:var(--ink);display:flex;align-items:center;justify-content:center;font-weight:bold}
    .info{flex:1}.nm{font-weight:600;color:var(--ink)}.sub{color:var(--muted);font-size:13px}
    .modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px}
    .sheet{background:#fff;border-radius:14px;max-width:420px;width:100%;padding:20px}
    .sheet h3{margin:0 0 12px;color:var(--ink)} .sheet .input{margin-bottom:10px}
    .actions{display:flex;gap:10px;justify-content:flex-end;margin-top:8px}
    .ghost{background:#fff;border:1px solid var(--ink);color:var(--ink)} .e{color:var(--bad);margin-bottom:8px}
  `],
})
export class Utilisateurs implements OnInit {
  items = signal<any[]>([]); loading = signal(true); show = signal(false); err = signal<string | null>(null);
  form: any = { name: '', email: '', telephone: '', password: '' };
  constructor(private api: Api) {}
  async ngOnInit() { await this.load(); }
  async load() { this.loading.set(true); try { this.items.set(await this.api.get('/admins')); } finally { this.loading.set(false); } }
  async save() {
    this.err.set(null);
    try { await this.api.post('/admins', this.form); this.show.set(false); this.form = { name: '', email: '', telephone: '', password: '' }; await this.load(); }
    catch (e: any) { this.err.set(e?.error?.message || e?.error?.errors?.email?.[0] || 'Erreur.'); }
  }
  ini(n: string) { const p = (n || '?').trim().split(' ').filter(Boolean); return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : (p[0] || '?').slice(0, 1)).toUpperCase(); }
}
