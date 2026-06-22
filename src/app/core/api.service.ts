import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Api {
  constructor(private http: HttpClient) {}
  private url(p: string) { return environment.apiUrl + p; }

  get<T = any>(p: string) { return firstValueFrom(this.http.get<T>(this.url(p))); }
  post<T = any>(p: string, body: any) { return firstValueFrom(this.http.post<T>(this.url(p), body)); }
  put<T = any>(p: string, body: any) { return firstValueFrom(this.http.put<T>(this.url(p), body)); }
  del<T = any>(p: string) { return firstValueFrom(this.http.delete<T>(this.url(p))); }
}

export function fcfa(v: any): string {
  const n = Number(v ?? 0);
  return n.toLocaleString('fr-FR').replace(/\u00A0/g, ' ');
}
