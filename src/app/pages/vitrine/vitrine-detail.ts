import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Api, fcfa } from '../../core/api.service';

@Component({
  selector: 'app-vitrine-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="top">
      <a routerLink="/vitrine" class="back">←</a>
      <a class="brandbox" routerLink="/apropos"><img [src]="logo" alt="SITS"/></a>
      <a class="lien" routerLink="/login">Connexion</a>
    </header>

    @if (loading()) { <p class="muted pad">Chargement...</p> }
    @else if (im(); as m) {
      <div class="hero">
        @if (video(); as v) { <video [src]="v" autoplay muted loop playsinline></video> }
        <div class="hov"><h1>{{ m.nom }}</h1><div class="vl">{{ m.ville }}</div></div>
      </div>

      <div class="wrap">
        @if (photos().length) {
          <div class="ph">@for (p of photos(); track p.id) { <img [src]="p.url" (click)="zoom(p.url)" alt=""/> }</div>
        }
        <h2>Logements disponibles</h2>
        @if (etages().length === 0) { <p class="muted">Aucun logement disponible.</p> }
        @for (e of etages(); track e) {
          <div class="etage">
            <div class="et-t">{{ etageLabel(e) }}</div>
            @for (l of logementsOf(e); track l.id) {
              <div class="lg" (click)="ouvrir(l)">
                <div>
                  <div class="l1">{{ l.type }} {{ l.reference }}</div>
                  <div class="l2">{{ fcfa(l.loyer) }} FCFA / mois</div>
                </div>
                <div class="r">
                  <span class="badge">Disponible</span>
                  <span class="photos-n">📷 {{ lgPhotos(l).length }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Galerie d'un appartement -->
      @if (gallery(); as g) {
        <div class="modal" (click)="gallery.set(null)">
          <div class="sheet" (click)="$event.stopPropagation()">
            <div class="sheet-h"><b>{{ galTitre() }}</b><button (click)="gallery.set(null)">✕</button></div>
            @if (g.length === 0) { <p class="muted">Aucune photo pour ce logement.</p> }
            <div class="gal">@for (u of g; track u) { <img [src]="u" (click)="zoom(u)" alt=""/> }</div>
          </div>
        </div>
      }

      <!-- Zoom plein ecran -->
      @if (big(); as b) {
        <div class="zoom" (click)="big.set(null)"><img [src]="b" alt=""/></div>
      }
    }
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:var(--bg)}
    .top{display:flex;justify-content:space-between;align-items:center;background:var(--ink);color:#fff;padding:12px 18px}
    .back{color:#fff;text-decoration:none;font-size:22px} .lien{color:var(--gold);text-decoration:none;font-weight:600}
    .brandbox{background:#fff;border-radius:8px;padding:5px 10px}.brandbox img{height:24px;display:block}
    .pad{padding:24px}
    .hero{position:relative;height:240px;background:var(--ink);overflow:hidden}
    .hero video{width:100%;height:100%;object-fit:cover}
    .hov{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:18px;background:linear-gradient(to bottom,transparent,rgba(0,0,0,.6))}
    .hov h1{color:#fff;margin:0} .vl{color:#cfe0d9}
    .wrap{max-width:900px;margin:0 auto;padding:18px 16px}
    h2{color:var(--ink)} .muted{color:var(--muted)}
    .ph{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}
    .ph img{width:150px;height:100px;object-fit:cover;border-radius:12px;cursor:pointer}
    .etage{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:12px}
    .et-t{font-weight:bold;color:var(--ink);margin-bottom:8px}
    .lg{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid var(--line);cursor:pointer}
    .lg:first-of-type{border-top:none}
    .lg:hover{opacity:.85}
    .l1{font-weight:600;color:var(--ink)} .l2{color:var(--ink)}
    .r{display:flex;align-items:center;gap:10px}
    .badge{background:#E7F1EC;color:var(--ok);font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px}
    .photos-n{color:var(--muted);font-size:13px}
    .modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px}
    .sheet{background:#fff;border-radius:14px;max-width:760px;width:100%;max-height:85vh;overflow:auto;padding:18px}
    .sheet-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .sheet-h button{border:none;background:none;font-size:18px;cursor:pointer}
    .gal{display:flex;gap:10px;flex-wrap:wrap}
    .gal img{width:200px;height:140px;object-fit:cover;border-radius:10px;cursor:pointer}
    .zoom{position:fixed;inset:0;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;z-index:60;padding:16px}
    .zoom img{max-width:100%;max-height:100%;border-radius:8px}
  `],
})
export class VitrineDetail implements OnInit {
  logo = environment.apiUrl.replace('/api', '') + '/logo-toursen.jpeg';
  im = signal<any>(null);
  loading = signal(true);
  gallery = signal<string[] | null>(null);
  big = signal<string | null>(null);
  private _galTitre = '';
  fcfa = fcfa;
  constructor(private api: Api, private route: ActivatedRoute) {}
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    try { this.im.set(await this.api.get('/public/immeubles/' + id)); }
    finally { this.loading.set(false); }
  }
  video(): string | null { const m = (this.im()?.medias || []).find((x: any) => x.type === 'video' && x.url); return m?.url || null; }
  photos(): any[] { return (this.im()?.medias || []).filter((x: any) => x.type === 'photo' && x.url); }
  lgPhotos(l: any): any[] { return (l.medias || []).filter((x: any) => x.type === 'photo' && x.url); }
  etages(): number[] { const s = new Set<number>(); (this.im()?.logements || []).forEach((l: any) => s.add(l.etage ?? 0)); return [...s].sort((a, b) => a - b); }
  logementsOf(e: number): any[] { return (this.im()?.logements || []).filter((l: any) => (l.etage ?? 0) === e); }
  etageLabel(e: number) { return e === 0 ? 'Rez-de-chaussée' : (e === 1 ? '1er étage' : e + 'e étage'); }
  ouvrir(l: any) { this._galTitre = `${l.type} ${l.reference}`; this.gallery.set(this.lgPhotos(l).map((p: any) => p.url)); }
  galTitre() { return this._galTitre; }
  zoom(u: string) { this.big.set(u); }
}
