import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../../core/api.service';

@Component({
  selector: 'app-immeubles',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1 class="ptitle">Immeubles</h1>
    @if (loading()) { <p class="muted">Chargement...</p> }
    @else if (error()) { <div class="card err">{{ error() }}</div> }
    @else if (items().length === 0) { <p class="muted">Aucun immeuble.</p> }
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
  `,
  styles: [`
    .ptitle{color:var(--ink);margin:0 0 18px}
    .muted{color:var(--muted)} .err{color:var(--bad)}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
    .imcard{position:relative;height:160px;border-radius:16px;overflow:hidden;text-decoration:none;background:var(--ink);display:block}
    .imcard img{width:100%;height:100%;object-fit:cover}
    .noimg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;color:#fff;background:var(--ink)}
    .ov{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:14px;background:linear-gradient(to bottom,transparent,rgba(0,0,0,.75))}
    .nm{color:#fff;font-weight:bold;font-size:17px} .vl{color:#cfe0d9;font-size:13px}
  `],
})
export class Immeubles implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  constructor(private api: Api) {}
  async ngOnInit() {
    try { this.items.set(await this.api.get('/immeubles')); }
    catch (e: any) { this.error.set(e?.error?.message || 'Erreur de chargement.'); }
    finally { this.loading.set(false); }
  }
  cover(im: any): string | null {
    if (im.photo_couverture_url) return im.photo_couverture_url;
    const m = (im.medias || []).find((x: any) => x.type === 'photo' && x.url);
    return m?.url || null;
  }
}
