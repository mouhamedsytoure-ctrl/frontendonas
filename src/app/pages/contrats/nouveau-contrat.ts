import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api.service';

@Component({
  selector: 'app-nouveau-contrat',
  standalone: true,
  imports: [FormsModule],
  template: `
    <a (click)="back()" class="back">← Contrats</a>
    <h1 class="ptitle">Nouveau contrat / locataire</h1>

    <div class="card">
      <h3>1. Logement</h3>
      <select class="input" [(ngModel)]="immeubleId" (ngModelChange)="onImmeuble($event)">
        <option [ngValue]="null">— Choisir un immeuble —</option>
        @for (im of immeubles(); track im.id) { <option [ngValue]="im.id">{{ im.nom }}</option> }
      </select>
      @if (immeubleId) {
        <select class="input" [(ngModel)]="etage" (ngModelChange)="chambre=null">
          <option [ngValue]="null">— Étage —</option>
          @for (e of etages(); track e) { <option [ngValue]="e">{{ etageLabel(e) }}</option> }
        </select>
      }
      @if (etage !== null) {
        <select class="input" [(ngModel)]="chambre" (ngModelChange)="onChambre($event)">
          <option [ngValue]="null">— Chambre disponible —</option>
          @for (l of chambresOf(); track l.id) { <option [ngValue]="l">{{ l.reference }} - {{ l.type }} ({{ l.loyer }} FCFA)</option> }
        </select>
      }
    </div>

    <div class="card">
      <h3>2. Identité du preneur</h3>
      <select class="input" [(ngModel)]="f.preneur_civilite">
        <option value="">— Civilité —</option>
        <option value="Monsieur">Monsieur</option>
        <option value="Madame">Madame</option>
        <option value="Mademoiselle">Mademoiselle</option>
      </select>
      <input class="input" placeholder="Nom *" [(ngModel)]="f.preneur_nom"/>
      <input class="input" placeholder="Prénom" [(ngModel)]="f.preneur_prenom"/>
      <input class="input" placeholder="Téléphone" [(ngModel)]="f.preneur_telephone"/>
      <input class="input" placeholder="Email *" [(ngModel)]="f.preneur_email"/>
      <input class="input" placeholder="Adresse" [(ngModel)]="f.preneur_adresse"/>
      <input class="input" placeholder="Profession" [(ngModel)]="f.preneur_profession"/>
      <input class="input" placeholder="Nationalité" [(ngModel)]="f.preneur_nationalite"/>
      <input class="input" placeholder="Lieu de naissance" [(ngModel)]="f.preneur_lieu_naissance"/>
      <input class="input" type="date" [(ngModel)]="f.preneur_date_naissance"/>
    </div>

    <div class="card">
      <h3>3. Pièce d'identité</h3>
      <select class="input" [(ngModel)]="f.preneur_piece_type">
        <option value="cni">CNI</option>
        <option value="passeport">Passeport</option>
        <option value="permis">Permis</option>
        <option value="autre">Autre</option>
      </select>
      <input class="input" placeholder="Numéro de pièce" [(ngModel)]="f.preneur_piece_numero"/>
    </div>

    <div class="card">
      <h3>4. Contrat</h3>
      <input class="input" placeholder="Composition (ex: 01 Séjour, 01 Chambre...)" [(ngModel)]="f.composition"/>
      <select class="input" [(ngModel)]="f.usage">
        <option value="domestique">Usage domestique</option>
        <option value="commercial">Usage commercial</option>
      </select>
      <label>Date de début</label>
      <input class="input" type="date" [(ngModel)]="f.date_debut"/>
      <label>Date de fin</label>
      <input class="input" type="date" [(ngModel)]="f.date_fin"/>
      <input class="input" type="number" placeholder="Loyer (FCFA) *" [(ngModel)]="f.montant_loyer"/>
      <input class="input" type="number" placeholder="Caution (FCFA)" [(ngModel)]="f.caution"/>
      <input class="input" type="number" placeholder="Jour d'échéance (1-31)" [(ngModel)]="f.jour_echeance"/>
      <input class="input" placeholder="Mot de passe (vide = généré)" [(ngModel)]="f.password"/>
    </div>

    @if (error()) { <div class="err">{{ error() }}</div> }
    @if (motDePasse()) { <div class="ok">Compte créé. Mot de passe à communiquer : <b>{{ motDePasse() }}</b></div> }

    <button class="btn btn-ink full" [disabled]="saving()" (click)="save()">
      {{ saving() ? 'Création...' : 'Créer le contrat' }}
    </button>
    <p class="note">Une fois créé, le contrat est figé (non modifiable).</p>
  `,
  styles: [`
    .back{color:var(--ink);text-decoration:none;font-weight:600;cursor:pointer;display:inline-block;margin-bottom:8px}
    .ptitle{color:var(--ink);margin:6px 0 16px}
    .card{margin-bottom:14px}
    h3{color:var(--ink);margin:0 0 10px;font-size:15px}
    .input{margin-bottom:10px}
    label{display:block;font-size:12px;color:var(--muted);margin:2px 0 4px}
    .full{width:100%;margin-top:6px}
    .err{color:var(--bad);margin:10px 0}
    .ok{color:var(--ok);margin:10px 0;background:#E7F1EC;padding:10px;border-radius:10px}
    .note{color:var(--muted);font-size:12px;text-align:center;margin-top:8px}
  `],
})
export class NouveauContrat implements OnInit {
  immeubles = signal<any[]>([]);
  dispo = signal<any[]>([]);
  immeubleId: number | null = null;
  etage: number | null = null;
  chambre: any = null;
  saving = signal(false);
  error = signal<string | null>(null);
  motDePasse = signal<string | null>(null);

  f: any = {
    preneur_civilite: '', preneur_nom: '', preneur_prenom: '', preneur_telephone: '',
    preneur_email: '', preneur_adresse: '', preneur_profession: '', preneur_nationalite: 'Senegalaise',
    preneur_lieu_naissance: '', preneur_date_naissance: '',
    preneur_piece_type: 'cni', preneur_piece_numero: '',
    composition: '', usage: 'domestique',
    date_debut: '', date_fin: '', montant_loyer: null, caution: null, jour_echeance: 5, password: '',
  };

  constructor(private api: Api, private router: Router) {}
  async ngOnInit() { this.immeubles.set(await this.api.get('/immeubles')); }
  back() { this.router.navigate(['/app/contrats']); }

  async onImmeuble(id: number | null) {
    this.etage = null; this.chambre = null; this.dispo.set([]);
    if (id) this.dispo.set(await this.api.get('/logements?immeuble_id=' + id + '&statut=disponible'));
  }
  etages(): number[] { const s = new Set<number>(); this.dispo().forEach(l => s.add(l.etage ?? 0)); return [...s].sort((a, b) => a - b); }
  chambresOf(): any[] { return this.dispo().filter(l => (l.etage ?? 0) === this.etage); }
  etageLabel(e: number) { return e === 0 ? 'Rez-de-chaussée' : (e === 1 ? '1er étage' : e + 'e étage'); }
  onChambre(l: any) { if (l && !this.f.montant_loyer) this.f.montant_loyer = Math.round(l.loyer); }

  async save() {
    this.error.set(null);
    if (!this.chambre) { this.error.set('Choisissez la chambre.'); return; }
    if (!this.f.preneur_nom || !this.f.preneur_email) { this.error.set('Nom et email obligatoires.'); return; }
    if (!this.f.date_debut || !this.f.date_fin) { this.error.set('Dates de début et de fin obligatoires.'); return; }
    this.saving.set(true);
    try {
      const body = { ...this.f, logement_id: this.chambre.id };
      Object.keys(body).forEach(k => { if (body[k] === '' || body[k] === null) delete body[k]; });
      const res: any = await this.api.post('/contrats', body);
      if (res?.mot_de_passe) { this.motDePasse.set(res.mot_de_passe); }
      setTimeout(() => this.router.navigate(['/app/contrats', res.contrat.id]), res?.mot_de_passe ? 2500 : 0);
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.error?.errors?.preneur_email?.[0] || 'Erreur lors de la création.');
    } finally { this.saving.set(false); }
  }
}
