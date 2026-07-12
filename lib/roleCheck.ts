import { redirect } from 'next/navigation';

/**
 * Check if user has required role on the server side
 */
export async function requireRole(allowedRoles: string[]) {
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  if (!allowedRoles.includes((session as any).user.role)) {
    redirect('/dashboard');
  }

  return session;
}

/**
 * Check if user is admin
 */
export async function requireAdmin() {
  return requireRole(['admin']);
}

/**
 * Client-side role check utility
 */
export function hasRole(userRole: string | undefined, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function isAdmin(userRole: string | undefined): boolean {
  return hasRole(userRole, ['admin']);
}

export function isUser(userRole: string | undefined): boolean {
  return hasRole(userRole, ['user']);
}
