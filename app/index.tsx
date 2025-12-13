import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { Loading } from '@/src/components/common';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <Loading />;
  }

  return isAuthenticated ? (
    <Redirect href="/(tabs)" />
  ) : (
    <Redirect href="/login" />
  );
}
