import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Api, fcfa } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-immeuble-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <!-- Fond vidéo floutée pleine page -->
    @if (video(); as v) {
      <video class="bg-video" [src]="v" autoplay muted loop playsinline></video>
    }
    <div class="bg-overlay"></div>

    <div class="page-content">
    <a routerLink="/app/immeubles" class="back">← Immeubles</a>
    @if (loading()) { <p class="muted">Chargement...</p> }
    @else if (im(); as m) {
      <div class="hero-title">
        <h1>{{ m.nom }}</h1>
        <div class="vl">{{ m.ville }}</div>
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

      <div class="lgh"><h3>Étages & logements</h3>@if (admin()) { <button class="addlg" (click)="ouvrirLg()">+ Ajouter un appartement</button> }</div>
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

      @if (modalLg()) {
        <div class="modal" (click)="modalLg.set(false)">
          <div class="sheet" (click)="$event.stopPropagation()" style="max-width:440px">
            <div class="sheet-h"><b>Nouvel appartement</b><button class="close" (click)="modalLg.set(false)">✕</button></div>
            <div class="lgform">
              <label>Référence *</label><input [(ngModel)]="lgRef" placeholder="Ex: A1, RDC-2..." />
              <label>Étage (0 = RDC) *</label><input type="number" [(ngModel)]="lgEtage" placeholder="0" />
              <label>Type *</label>
              <select [(ngModel)]="lgType">
                <option value="appartement">Appartement</option>
                <option value="studio">Studio</option>
                <option value="mini_studio">Mini studio</option>
                <option value="local_commercial">Local commercial</option>
              </select>
              <label>Loyer (FCFA) *</label><input type="number" [(ngModel)]="lgLoyer" placeholder="125000" />
              <label>Statut</label>
              <select [(ngModel)]="lgStatut">
                <option value="disponible">Disponible</option>
                <option value="loue">Loué</option>
                <option value="indisponible">Indisponible</option>
              </select>
              @if (errLg()) { <div class="errm">{{ errLg() }}</div> }
              <button class="btn gold" [disabled]="up()" (click)="creerLg()">Créer l'appartement</button>
            </div>
          </div>
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
    </div>
  `,
  styles: [`
    :host{display:block;position:relative;min-height:100vh}
    /* --- fond vidéo floutée --- */
    .bg-video{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(3px);transform:scale(1.04);z-index:0}
    .bg-overlay{position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:1}
    .page-content{position:relative;z-index:10;padding:24px;max-width:1200px}
    /* --- titre --- */
    .hero-title{margin-bottom:18px}
    .hero-title h1{color:#fff;margin:0 0 4px;font-size:26px;text-shadow:0 2px 8px rgba(0,0,0,.6)}
    .vl{color:#cfe0d9;font-size:14px}
    /* --- nav --- */
    .back{color:#fff;text-decoration:none;font-weight:600;display:inline-block;margin-bottom:14px;opacity:.85}
    .back:hover{opacity:1}
    .muted{color:#cfe0d9}
    /* --- outils upload --- */
    .tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
    .btn{border:none;border-radius:10px;padding:10px 14px;font-weight:700;font-size:13px;cursor:pointer}
    .btn.ink{background:rgba(20,42,36,.85);backdrop-filter:blur(6px);color:#fff;border:1px solid rgba(255,255,255,.2)}
    .btn.gold{background:var(--gold);color:var(--ink)}
    .btn.sm{padding:6px 10px;font-size:12px}
    .btn:disabled{opacity:.6}
    .upmsg{color:#cfe0d9;font-size:12px}
    /* --- photos --- */
    h3{color:#fff;margin:16px 0 10px;text-shadow:0 1px 4px rgba(0,0,0,.5)}
    .ph{display:flex;gap:10px;flex-wrap:wrap}
    .thumb,.gthumb{position:relative}
    .ph img{width:150px;height:104px;object-fit:cover;border-radius:12px;cursor:pointer}
    .x{position:absolute;top:6px;right:6px;background:rgba(178,58,58,.92);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:12px}
    .star{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,.45);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer}
    .star.on{background:var(--gold);color:var(--ink)}
    /* --- étages & logements --- */
    .lgh{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
    .addlg{background:var(--gold);color:var(--ink);border:none;border-radius:9px;padding:8px 12px;font-weight:700;font-size:12px;cursor:pointer}
    .card.et{background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:14px;margin-bottom:12px}
    .ettitle{font-weight:bold;color:#fff;margin-bottom:8px}
    .lg{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.15)}
    .lg-main{flex:1;display:flex;justify-content:space-between;align-items:center;cursor:pointer}
    .lg-main:hover{opacity:.85}
    .lg-main span:first-child{color:#fff}
    .lg .r{display:flex;align-items:center;gap:10px}
    .photos-n{color:#cfe0d9;font-size:13px}
    .badge{font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px}
    .addph{background:rgba(255,255,255,.15);border:1px solid var(--gold);color:#fff;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;white-space:nowrap}
    /* --- modals --- */
    .modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px}
    .sheet{background:#fff;border-radius:14px;max-width:760px;width:100%;max-height:85vh;overflow:auto;padding:18px}
    .sheet-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:10px}
    .sheet-h span{display:flex;align-items:center;gap:8px}
    .close{border:none;background:none;font-size:18px;cursor:pointer}
    .gal{display:flex;gap:10px;flex-wrap:wrap}
    .gal img{width:200px;height:140px;object-fit:cover;border-radius:10px;cursor:pointer}
    .zoom{position:fixed;inset:0;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;z-index:60;padding:16px}
    .zoom img{max-width:100%;max-height:100%;border-radius:8px}
    /* --- formulaire logement --- */
    .lgform{display:flex;flex-direction:column;gap:4px}
    .lgform label{font-size:11px;color:var(--muted);margin-top:6px}
    .lgform input,.lgform select{border:1px solid var(--line);border-radius:9px;padding:10px;font-size:14px;font-family:inherit}
    .lgform .btn{margin-top:12px}
    .btn.gold{background:var(--gold);color:var(--ink);border:none;border-radius:10px;padding:12px;font-weight:800;cursor:pointer}
    .errm{color:var(--bad);font-size:13px;margin-top:6px}
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

  // --- creation d'appartement ---
  modalLg = signal(false);
  errLg = signal<string | null>(null);
  lgRef = ''; lgEtage = 0; lgType = 'appartement'; lgLoyer: number | null = null; lgStatut = 'disponible';
  ouvrirLg() { this.errLg.set(null); this.lgRef = ''; this.lgEtage = 0; this.lgType = 'appartement'; this.lgLoyer = null; this.lgStatut = 'disponible'; this.modalLg.set(true); }
  async creerLg() {
    if (!this.lgRef.trim()) { this.errLg.set('Indique une référence.'); return; }
    if (this.lgLoyer == null) { this.errLg.set('Indique le loyer.'); return; }
    this.up.set(true);
    try {
      await firstValueFrom(this.http.post(environment.apiUrl + '/logements', {
        immeuble_id: this.im().id, reference: this.lgRef, etage: Number(this.lgEtage) || 0,
        type: this.lgType, loyer: this.lgLoyer, statut: this.lgStatut,
      }));
      this.modalLg.set(false);
      await this.reload();
    } catch (e: any) { this.errLg.set(e?.error?.message || 'Création impossible.'); }
    finally { this.up.set(false); }
  }
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
