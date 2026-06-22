import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-apropos',
  standalone: true,
  template: `
    <header class="top">
      <button class="back" (click)="retour()">← Retour</button>
      <span class="ttl">À propos</span>
    </header>

    <div class="wrap">
      <div class="logobox"><img [src]="logo" alt="SITS"/></div>

      <h1>Société Immobilière de Travaux et Services</h1>
      <p class="baseline">« SITS » SUARL</p>

      <div class="card">
        <p>
          <b>SITS</b> (Société Immobilière de Travaux et Services) est une entreprise
          sénégalaise basée à Dakar, spécialisée dans la <b>gestion locative</b>,
          la mise en location et le suivi de biens immobiliers (immeubles, appartements,
          studios, locaux commerciaux et terrains).
        </p>
        <p>
          Fondée et dirigée par <b>Moustapha Touré</b>, l'entreprise met un point d'honneur
          à offrir un service de proximité, transparent et rigoureux, aussi bien aux
          propriétaires qu'aux locataires : contrats clairs, quittances en règle,
          suivi des loyers et traitement rapide des réclamations.
        </p>
        <p>
          Grâce à cette plateforme, SITS modernise sa gestion : suivi des paiements,
          contrats et reçus numériques, et une vitrine en ligne des logements disponibles.
        </p>
      </div>

      <div class="card coords">
        <h3>Coordonnées</h3>
        <p>📍 Médina, rue 13 X 12, Dakar, Sénégal</p>
        <p>📞 77 566 03 77 / 77 735 37 72</p>
        <p>✉️ toursen.immo&#64;gmail.com</p>
      </div>

      <p class="note">Texte de présentation modifiable à tout moment.</p>
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:var(--bg)}
    .top{display:flex;align-items:center;gap:14px;background:var(--ink);color:#fff;padding:12px 18px}
    .back{background:none;border:none;color:#fff;font-size:15px;cursor:pointer;font-weight:600}
    .ttl{font-weight:bold}
    .wrap{max-width:760px;margin:0 auto;padding:24px 16px;text-align:center}
    .logobox{background:#fff;border-radius:14px;padding:14px;display:inline-block;margin-bottom:14px}
    .logobox img{max-height:70px}
    h1{color:var(--ink);margin:6px 0 2px;font-size:22px}
    .baseline{color:var(--gold);font-weight:600;margin:0 0 18px}
    .card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;text-align:left;margin-bottom:14px}
    .card p{color:var(--ink);line-height:1.6;margin:0 0 10px}
    .coords h3{color:var(--ink);margin:0 0 8px}
    .coords p{margin:4px 0;color:var(--ink)}
    .note{color:var(--muted);font-size:12px}
  `],
})
export class Apropos {
  logo = environment.apiUrl.replace('/api', '') + '/logo-toursen.jpeg';
  constructor(private location: Location) {}
  retour() { this.location.back(); }
}
