import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { Loading } from '@/src/components/common';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Carregar dados do usuário ao iniciar
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 3000);

    loadUser()
      .then(() => {
        setInitialized(true);
      })
      .catch(err => {
        console.error('❌ Erro ao carregar usuário:', err);
        setError(err.message || 'Erro ao carregar dados');
        setInitialized(true);
      })
      .finally(() => {
        clearTimeout(timer);
      });

    return () => clearTimeout(timer);
  }, []);

  // Proteger rotas baseado em autenticação
  useEffect(() => {
    if (!initialized || isLoading || error) return;

    const inAuthGroup = segments?.[0] === '(tabs)';
    
    // Apenas proteger tabs - não interferir em outras navegações
    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    }
  }, [isAuthenticated, segments, isLoading, error, initialized, router]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Erro</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setInitialized(false);
            loadUser();
          }}
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!initialized || isLoading) {
    return <Loading />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-patient" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
