import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'locataire' | string;
  telephone?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _token = signal<string | null>(localStorage.getItem('token'));
  private _user = signal<AppUser | null>(this.readUser());

  token = computed(() => this._token());
  user = computed(() => this._user());
  isAuthenticated = computed(() => !!this._token());
  role = computed(() => this._user()?.role ?? '');

  constructor(private http: HttpClient) {}

  private readUser(): AppUser | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  async login(email: string, password: string): Promise<void> {
    const res: any = await firstValueFrom(
      this.http.post(`${environment.apiUrl}/login`, { email, password })
    );
    this._token.set(res.token);
    this._user.set(res.user);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
