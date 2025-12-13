import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants';
import { useAuthStore } from '@/src/store/authStore';
import { UserRole } from '@/src/types';

export default function TabsLayout() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.NUTRITIONIST;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Plano Alimentar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
          href: isAdmin ? null : '/meal-plan',
        }}
      />

      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Consultas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          href: isAdmin ? null : '/appointments',
        }}
      />

      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Receitas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
          href: isAdmin ? '/recipes' : null,
        }}
      />

      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          href: isAdmin ? '/schedule' : null,
        }}
      />

      <Tabs.Screen
        name="patients"
        options={{
          title: 'Pacientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          href: isAdmin ? '/patients' : null,
        }}
      />

      <Tabs.Screen
        name="conversations"
        options={{
          title: 'Conversas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
          href: user?.role === 'PATIENT' || user?.role === 'NUTRITIONIST' ? '/conversations' : null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
