import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  template: `
    <div class="ph">
      <div class="ph-ic">🚧</div>
      <h2>{{ titre }}</h2>
      <p>Cette section arrive très bientôt.</p>
    </div>
  `,
  styles: [`
    .ph { text-align: center; padding: 60px 20px; color: var(--muted); }
    .ph-ic { font-size: 46px; }
    h2 { color: var(--ink); margin: 10px 0 6px; }
  `],
})
export class Placeholder {
  titre = 'Section';
  constructor(route: ActivatedRoute) {
    this.titre = route.snapshot.data['titre'] ?? 'Section';
  }
}
