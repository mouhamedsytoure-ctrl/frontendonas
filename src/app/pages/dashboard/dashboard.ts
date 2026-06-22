import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { Api, fcfa } from '../../core/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  d = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  immeubles = signal<any[]>([]);
  expirent = signal<any[]>([]);
  paiements = signal<any[]>([]);
  reclamations = signal<any[]>([]);
  retard = signal<any[]>([]);

  fcfa = fcfa;
  periode = new Date().toISOString().slice(0, 7);

  constructor(private api: Api) {}

  async ngOnInit() {
    try {
      const [stats, immeubles, contrats, paiements, recs, locs]: any = await Promise.all([
        this.api.get('/dashboard'),
        this.api.get('/immeubles'),
        this.api.get('/contrats'),
        this.api.get('/paiements'),
        this.api.get('/reclamations'),
        this.api.get('/locataires'),
      ]);
      this.d.set(stats);
      this.immeubles.set((immeubles as any[]).slice(0, 6));

      // contrats qui expirent dans <= 60 jours (actifs)
      const exp = (contrats as any[])
        .map(c => ({ ...c, j: this.jours(c) }))
        .filter(c => c.statut === 'actif' && c.j !== null && c.j <= 60)
        .sort((a, b) => a.j - b.j);
      this.expirent.set(exp);

      // derniers paiements payes
      this.paiements.set((paiements as any[]).filter(p => p.statut === 'paye').slice(0, 6));

      // reclamations recentes (non resolues d'abord)
      this.reclamations.set((recs as any[])
        .sort((a, b) => (a.statut === 'resolu' ? 1 : 0) - (b.statut === 'resolu' ? 1 : 0))
        .slice(0, 6));

      // locataires en retard ce mois
      const payeIds = new Set((paiements as any[])
        .filter(p => p.periode === this.periode && p.statut === 'paye')
        .map(p => p.user_id ?? p.contrat?.user_id));
      const retard = (locs as any[]).map(l => {
        const c = (l.contrats || [])[0]; const lg = c?.logement; const im = lg?.immeuble;
        return { id: l.id, name: l.name, loyer: c?.montant_loyer || 0,
          logement: lg ? `${im?.nom || ''} - ${lg.reference || ''}` : '—',
          paye: payeIds.has(l.id), contratId: c?.id };
      }).filter(r => r.loyer > 0 && !r.paye);
      this.retard.set(retard);
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Impossible de charger le tableau de bord.');
    } finally {
      this.loading.set(false);
    }
  }

  jours(c: any): number | null {
    if (!c.date_fin) return null;
    const dte = new Date(c.date_fin); if (isNaN(+dte)) return null;
    return Math.floor((+dte - Date.now()) / 86400000);
  }
  nom(c: any) { return `${c.preneur_prenom || ''} ${c.preneur_nom || ''}`.trim() || '(sans nom)'; }
  cover(im: any): string | null {
    if (im.photo_couverture_url) return im.photo_couverture_url;
    const m = (im.medias || []).find((x: any) => x.type === 'photo' && x.url);
    return m?.url || null;
  }
}
