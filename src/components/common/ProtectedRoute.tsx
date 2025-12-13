import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { Loading } from './Loading';
import { UserRole } from '@/src/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Componente para proteger rotas que requerem autenticação
 * Redireciona para login se não autenticado
 * Opcionalmente verifica roles específicas
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Se não autenticado, redirecionar para login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Se roles específicas são requeridas, verificar
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Usuário autenticado mas sem permissão
      router.replace('/(tabs)'); // Redirecionar para página inicial
    }
  }, [isAuthenticated, isLoading, user, allowedRoles]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null; // Não renderizar nada enquanto redireciona
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // Não renderizar se não tem permissão
  }

  return <>{children}</>;
}
