import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  logo = environment.apiUrl.replace('/api', '') + '/logo-toursen.jpeg';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  async submit() {
    this.error.set(null);
    this.loading.set(true);
    try {
      await this.auth.login(this.email.trim(), this.password);
      const role = this.auth.role();
      if (role === 'super_admin' || role === 'admin') {
        this.router.navigate(['/app']);
      } else {
        this.router.navigate(['/espace']);
      }
    } catch (e: any) {
      const msg = e?.error?.message
        || e?.error?.errors?.email?.[0]
        || 'Connexion impossible. Verifiez vos identifiants ou le serveur.';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
