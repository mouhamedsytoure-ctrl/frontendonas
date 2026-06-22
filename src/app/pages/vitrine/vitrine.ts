import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Api } from '../../core/api.service';

@Component({
  selector: 'app-vitrine',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="top">
      <a class="brandbox" routerLink="/apropos"><img [src]="logo" alt="SITS"/></a>
      <a class="lien" routerLink="/login">Espace connexion</a>
    </header>

    <div class="wrap">
      <h1>Logements à louer</h1>
      <p class="sub">Découvrez nos biens disponibles.</p>

      @if (loading()) { <p class="muted">Chargement...</p> }
      @else if (items().length === 0) { <p class="muted">Aucun logement disponible pour le moment.</p> }
      @else {
        <div class="grid">
          @for (im of items(); track im.id) {
            <a class="card" [routerLink]="['/vitrine', im.id]">
              @if (cover(im); as c) { <img [src]="c" alt=""/> } @else { <div class="noimg">🏢</div> }
              <div class="ov">
                <div class="nm">{{ im.nom }}</div>
                <div class="vl">{{ im.ville }}</div>
                <span class="badge" [style.background]="(im.disponibles_count||0) > 0 ? 'var(--gold)' : '#ffffff55'"
                      [style.color]="(im.disponibles_count||0) > 0 ? 'var(--ink)' : '#fff'">
                  {{ (im.disponibles_count||0) > 0 ? im.disponibles_count + ' dispo' : 'Complet' }}
                </span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:var(--bg)}
    .top{display:flex;justify-content:space-between;align-items:center;background:var(--ink);color:#fff;padding:14px 20px}
    .brandbox{background:#fff;border-radius:8px;padding:5px 10px}.brandbox img{height:26px;display:block}
    .logo{width:34px;height:34px;border-radius:8px;background:var(--gold);color:var(--ink);display:inline-flex;align-items:center;justify-content:center;font-weight:bold}
    .lien{color:var(--gold);text-decoration:none;font-weight:600}
    .wrap{max-width:1100px;margin:0 auto;padding:24px 16px}
    h1{color:var(--ink);margin:0 0 4px} .sub{color:var(--muted);margin:0 0 18px} .muted{color:var(--muted)}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
    .card{position:relative;height:180px;border-radius:18px;overflow:hidden;background:var(--ink);text-decoration:none}
    .card img{width:100%;height:100%;object-fit:cover}
    .noimg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:42px;color:#fff}
    .ov{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:16px;background:linear-gradient(to bottom,transparent,rgba(0,0,0,.75))}
    .nm{color:#fff;font-weight:bold;font-size:18px} .vl{color:#cfe0d9;font-size:13px;margin-bottom:6px}
    .badge{align-self:flex-start;font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px}
  `],
})
export class Vitrine implements OnInit {
  items = signal<any[]>([]);
  logo = environment.apiUrl.replace('/api', '') + '/logo-toursen.jpeg';
  loading = signal(true);
  constructor(private api: Api) {}
  async ngOnInit() {
    try { this.items.set(await this.api.get('/public/immeubles')); }
    finally { this.loading.set(false); }
  }
  cover(im: any): string | null {
    const m = (im.medias || []).find((x: any) => x.type === 'photo' && x.url);
    return m?.url || null;
  }
}
