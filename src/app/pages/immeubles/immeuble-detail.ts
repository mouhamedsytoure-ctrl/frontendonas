import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Api, fcfa } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-immeuble-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a routerLink="/app/immeubles" class="back">← Immeubles</a>
    @if (loading()) { <p class="muted">Chargement...</p> }
    @else if (im(); as m) {
      <div class="hero">
        @if (video(); as v) {
          <video #vid [src]="v" autoplay muted loop playsinline (click)="fs(vid)" style="cursor:pointer"></video>
          <button class="fsbtn" (click)="fs(vid)" title="Plein écran">⛶</button>
        } @else { <div class="novid">Pas de vidéo</div> }
        <div class="hov"><h1>{{ m.nom }}</h1><div class="vl">{{ m.ville }}</div></div>
      </div>

      @if (admin()) {
        <div class="tools">
          <button class="btn ink" [disabled]="up()" (click)="pick('image/*','immeuble',m.id)">📷 Ajouter une photo</button>
          <button class="btn gold" [disabled]="up()" (click)="pick('video/*','immeuble',m.id)">🎥 Ajouter/Remplacer la vidéo</button>
          @if (up()) { <span class="upmsg">Envoi en cours… {{ prog() }}</span> }
        </div>
      }

      @if (photos().length) {
        <h3>Photos de l'immeuble</h3>
        <div class="ph">
          @for (p of photos(); track p.id) {
            <div class="thumb">
              <img [src]="p.url" (click)="zoom(p.url)" alt=""/>
              @if (admin()) {
                <button class="x" (click)="suppr(p.id)" title="Supprimer">✕</button>
                <button class="star" [class.on]="p.couverture" (click)="cover(p.id)" title="Définir comme couverture">★</button>
              }
            </div>
          }
        </div>
      }

      <h3>Étages & logements</h3>
      @for (et of etages(); track et) {
        <div class="card et">
          <div class="ettitle">{{ etageLabel(et) }}</div>
          @for (l of logementsOf(et); track l.id) {
            <div class="lg">
              <div class="lg-main" (click)="ouvrir(l)">
                <span>{{ l.reference }} — {{ l.type }}</span>
                <span class="r">
                  <span class="photos-n">📷 {{ lgPhotos(l).length }}</span>
                  <span class="badge" [style.background]="l.statut==='disponible' ? '#E7F1EC' : '#FBEEDD'"
                        [style.color]="l.statut==='disponible' ? 'var(--ok)' : 'var(--warn)'">{{ l.statut }}</span>
                  <b>{{ fcfa(l.loyer) }} FCFA</b>
                </span>
              </div>
              @if (admin()) {
                <button class="addph" [disabled]="up()" (click)="pick('image/*','logement',l.id)">＋ photo</button>
              }
            </div>
          }
        </div>
      }

      @if (gallery(); as g) {
        <div class="modal" (click)="gallery.set(null)">
          <div class="sheet" (click)="$event.stopPropagation()">
            <div class="sheet-h">
              <b>{{ galTitre() }}</b>
              <span>
                @if (admin() && galId()) { <button class="btn ink sm" [disabled]="up()" (click)="addGalleryPhoto()">＋ photo</button> }
                <button class="close" (click)="gallery.set(null)">✕</button>
              </span>
            </div>
            @if (g.length === 0) { <p class="muted">Aucune photo pour ce logement.</p> }
            <div class="gal">
              @for (p of g; track p.id) {
                <div class="gthumb">
                  <img [src]="p.url" (click)="zoom(p.url)" alt=""/>
                  @if (admin()) { <button class="x" (click)="suppr(p.id)">✕</button> }
                </div>
              }
            </div>
          </div>
        </div>
      }
      @if (big(); as b) { <div class="zoom" (click)="big.set(null)"><img [src]="b" alt=""/></div> }
    }
  `,
  styles: [`
    .back{color:var(--ink);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:14px}
    .muted{color:var(--muted)}
    .hero{position:relative;height:200px;border-radius:18px;overflow:hidden;background:var(--ink);margin-bottom:14px}
    .hero video{width:100%;height:100%;object-fit:cover}
    .novid{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#9fb3ab;font-size:13px}
    .hov{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:18px;background:linear-gradient(to bottom,transparent,rgba(0,0,0,.6))}
    .hov h1{color:#fff;margin:0} .vl{color:#cfe0d9}
    .fsbtn{position:absolute;top:10px;right:10px;z-index:2;background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:8px;width:36px;height:36px;font-size:18px;cursor:pointer}
    .tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:8px}
    .btn{border:none;border-radius:10px;padding:10px 14px;font-weight:700;font-size:13px;cursor:pointer}
    .btn.ink{background:var(--ink);color:#fff}.btn.gold{background:var(--gold);color:var(--ink)}.btn.sm{padding:6px 10px;font-size:12px}
    .btn:disabled{opacity:.6}
    .upmsg{color:var(--muted);font-size:12px}
    h3{color:var(--ink);margin:16px 0 10px}
    .ph{display:flex;gap:10px;flex-wrap:wrap}
    .thumb,.gthumb{position:relative}
    .ph img{width:150px;height:104px;object-fit:cover;border-radius:12px;cursor:pointer}
    .x{position:absolute;top:6px;right:6px;background:rgba(178,58,58,.92);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:12px}
    .star{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,.45);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer}
    .star.on{background:var(--gold);color:var(--ink)}
    .et{margin-bottom:12px}.ettitle{font-weight:bold;color:var(--ink);margin-bottom:8px}
    .lg{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)}
    .lg-main{flex:1;display:flex;justify-content:space-between;align-items:center;cursor:pointer}
    .lg-main:hover{opacity:.85}
    .lg .r{display:flex;align-items:center;gap:10px}
    .photos-n{color:var(--muted);font-size:13px}
    .addph{background:#fff;border:1px solid var(--gold);color:var(--ink);border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;white-space:nowrap}
    .modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px}
    .sheet{background:#fff;border-radius:14px;max-width:760px;width:100%;max-height:85vh;overflow:auto;padding:18px}
    .sheet-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:10px}
    .sheet-h span{display:flex;align-items:center;gap:8px}
    .close{border:none;background:none;font-size:18px;cursor:pointer}
    .gal{display:flex;gap:10px;flex-wrap:wrap}
    .gal img{width:200px;height:140px;object-fit:cover;border-radius:10px;cursor:pointer}
    .zoom{position:fixed;inset:0;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;z-index:60;padding:16px}
    .zoom img{max-width:100%;max-height:100%;border-radius:8px}
    @media(max-width:560px){ .ph img{width:46%;height:90px} .gal img{width:46%} }
  `],
})
export class ImmeubleDetail implements OnInit {
  im = signal<any>(null);
  loading = signal(true);
  up = signal(false);
  prog = signal('');
  gallery = signal<any[] | null>(null);
  big = signal<string | null>(null);
  private _galId: number | null = null;
  private _galTitre = '';
  fcfa = fcfa;

  constructor(private api: Api, private route: ActivatedRoute, private http: HttpClient, private auth: AuthService) {}

  admin() { const r = this.auth.role(); return r === 'admin' || r === 'super_admin'; }

  async ngOnInit() { await this.reload(); }
  async reload() {
    this.loading.set(true);
    try {
      const id = this.route.snapshot.paramMap.get('id');
      this.im.set(await this.api.get('/immeubles/' + id));
      // si une galerie est ouverte, la rafraichir
      if (this._galId != null) {
        const l = (this.im()?.logements || []).find((x: any) => x.id === this._galId);
        if (l) this.gallery.set(this.lgPhotos(l));
      }
    } finally { this.loading.set(false); }
  }

  video(): string | null { const m = (this.im()?.medias || []).find((x: any) => x.type === 'video' && x.url); return m?.url || null; }
  photos(): any[] { return (this.im()?.medias || []).filter((x: any) => x.type === 'photo' && x.url); }
  lgPhotos(l: any): any[] { return (l.medias || []).filter((x: any) => x.type === 'photo' && x.url); }
  etages(): number[] { const s = new Set<number>(); (this.im()?.logements || []).forEach((l: any) => s.add(l.etage ?? 0)); return [...s].sort((a, b) => a - b); }
  logementsOf(e: number): any[] { return (this.im()?.logements || []).filter((l: any) => (l.etage ?? 0) === e); }
  etageLabel(e: number) { return e === 0 ? 'Rez-de-chaussée' : (e === 1 ? '1er étage' : e + 'e étage'); }
  fs(el: HTMLVideoElement) { if (el.requestFullscreen) el.requestFullscreen(); }
  ouvrir(l: any) { this._galId = l.id; this._galTitre = l.reference + ' — ' + l.type; this.gallery.set(this.lgPhotos(l)); }
  galTitre() { return this._galTitre; }
  galId() { return this._galId; }
  addGalleryPhoto() { if (this._galId != null) this.pick('image/*', 'logement', this._galId); }
  zoom(u: string) { this.big.set(u); }

  // --- upload / suppression / couverture ---
  pick(accept: string, type: string, id: number) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept;
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) this.upload(f, type, id); };
    inp.click();
  }
  async upload(file: File, type: string, id: number) {
    this.up.set(true); this.prog.set('');
    try {
      // une vidéo d'immeuble REMPLACE l'ancienne
      if (type === 'immeuble' && file.type.startsWith('video')) {
        const olds = (this.im()?.medias || []).filter((x: any) => x.type === 'video');
        for (const o of olds) { try { await firstValueFrom(this.http.delete(environment.apiUrl + '/medias/' + o.id)); } catch {} }
      }
      const fd = new FormData();
      fd.append('fichier', file);
      fd.append('mediable_type', type);
      fd.append('mediable_id', String(id));
      await firstValueFrom(this.http.post(environment.apiUrl + '/medias', fd));
      await this.reload();
    } catch (e: any) {
      alert('Envoi impossible : ' + (e?.error?.message || 'fichier trop lourd ou erreur réseau.'));
    } finally { this.up.set(false); }
  }
  async suppr(id: number) {
    if (!confirm('Supprimer ce média ?')) return;
    this.up.set(true);
    try { await firstValueFrom(this.http.delete(environment.apiUrl + '/medias/' + id)); await this.reload(); }
    finally { this.up.set(false); }
  }
  async cover(id: number) {
    this.up.set(true);
    try { await firstValueFrom(this.http.put(environment.apiUrl + '/medias/' + id + '/couverture', {})); await this.reload(); }
    finally { this.up.set(false); }
  }
}