import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService); const router = inject(Router);
  if (!auth.isAuthenticated()) { router.navigate(['/login']); return false; }
  const r = auth.role();
  if (r === 'super_admin' || r === 'admin') return true;
  router.navigate(['/espace']); return false;
};

export const locataireGuard: CanActivateFn = () => {
  const auth = inject(AuthService); const router = inject(Router);
  if (!auth.isAuthenticated()) { router.navigate(['/login']); return false; }
  if (auth.role() === 'locataire') return true;
  router.navigate(['/app']); return false;
};
