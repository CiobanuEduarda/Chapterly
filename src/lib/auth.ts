export type UserRole = 'USER' | 'ADMIN';

export function getUserRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userRole') as UserRole;
}

export function isAdmin(): boolean {
  return getUserRole() === 'ADMIN';
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  window.location.href = '/login';
} 