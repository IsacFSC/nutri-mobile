import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { Card, Loading } from '@/src/components/common';
import { Colors, Typography, Spacing } from '@/src/constants';
import { UserRole } from '@/src/types';
import DashboardService, { NutritionistStats, AdminStats } from '@/src/services/dashboard.service';

export default function HomeScreen() {
  const { user, isLoading } = useAuthStore();
  const [nutritionistStats, setNutritionistStats] = useState<NutritionistStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Todas as variáveis derivadas devem ser declaradas antes de early returns
  const isAdmin = user?.role === UserRole.ADMIN;
  const isNutritionist = user?.role === UserRole.NUTRITIONIST;

  // Load stats based on user role
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      if (user?.role === 'NUTRITIONIST') {
        const data = await DashboardService.getNutritionistStats();
        setNutritionistStats(data);
      } else if (user?.role === 'ADMIN') {
        const data = await DashboardService.getAdminStats();
        setAdminStats(data);
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
      if (!error?.isAuthError) {
        Alert.alert('Erro', 'Não foi possível carregar as estatísticas');
      }
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'NUTRITIONIST' || user?.role === 'ADMIN') {
      loadStats();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  // Early return após todos os hooks
  if (isLoading || !user) {
    return <Loading />;
  }

  // ADMIN Dashboard
  if (isAdmin) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {user.name?.split(' ')[0]}!</Text>
          <Text style={styles.role}>Administrador da Plataforma</Text>
        </View>

        <View style={styles.adminStatsContainer}>
          <View style={styles.adminStatsRow}>
            <View style={styles.adminStatCard}>
              <Ionicons name="business" size={32} color={Colors.primary} />
              <Text style={styles.statValue}>
                {loadingStats ? '...' : adminStats?.organizationsCount || 0}
              </Text>
              <Text style={styles.statLabel}>Organizações</Text>
            </View>
            <View style={styles.adminStatCard}>
              <Ionicons name="people" size={32} color={Colors.accent} />
              <Text style={styles.statValue}>
                {loadingStats ? '...' : adminStats?.totalNutritionists || 0}
              </Text>
              <Text style={styles.statLabel}>Nutricionistas</Text>
            </View>
          </View>
          <View style={styles.adminStatsRow}>
            <View style={styles.adminStatCard}>
              <Ionicons name="person" size={32} color={Colors.success} />
              <Text style={styles.statValue}>
                {loadingStats ? '...' : adminStats?.patientsCount || 0}
              </Text>
              <Text style={styles.statLabel}>Pacientes</Text>
            </View>
            <View style={styles.adminStatCard}>
              <Ionicons name="restaurant" size={32} color={Colors.secondary} />
              <Text style={styles.statValue}>
                {loadingStats ? '...' : adminStats?.recipesCount || 0}
              </Text>
              <Text style={styles.statLabel}>Receitas</Text>
            </View>
          </View>
        </View>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Painel Administrativo</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/dashboard')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="stats-chart" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/organizations')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="business-outline" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.actionText}>Organizações</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/nutritionists')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="people-outline" size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.actionText}>Nutricionistas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/patients')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="person-outline" size={24} color={Colors.success} />
              </View>
              <Text style={styles.actionText}>Pacientes</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    );
  }

  // NUTRITIONIST Dashboard
  if (isNutritionist) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, Dr(a). {user.name?.split(' ')[0]}!</Text>
          <Text style={styles.role}>Painel do Nutricionista</Text>
        </View>

        <View style={styles.nutritionistStats}>
          <View style={styles.nutritionistStatCard}>
            <Ionicons name="people" size={32} color={Colors.primary} />
            <Text style={styles.statValue}>
              {loadingStats ? '...' : nutritionistStats?.activePatientsCount || 0}
            </Text>
            <Text style={styles.statLabel}>Pacientes Ativos</Text>
          </View>
          <View style={styles.nutritionistStatCard}>
            <Ionicons name="calendar" size={32} color={Colors.accent} />
            <Text style={styles.statValue}>
              {loadingStats ? '...' : nutritionistStats?.todayAppointmentsCount || 0}
            </Text>
            <Text style={styles.statLabel}>Consultas Hoje</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <TouchableOpacity 
            style={styles.cardHeader}
            onPress={() => router.push('/(tabs)/appointments')}
          >
            <Text style={styles.cardTitle}>Próximas Consultas</Text>
            <Text style={styles.cardLink}>Ver todas</Text>
          </TouchableOpacity>
          
          {loadingStats ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Carregando...</Text>
            </View>
          ) : nutritionistStats?.upcomingAppointments && nutritionistStats.upcomingAppointments.length > 0 ? (
            <View>
              {nutritionistStats.upcomingAppointments.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.appointmentItem}
                  onPress={() => router.push(`/chat/${appointment.id}`)}
                >
                  <View style={styles.appointmentIcon}>
                    <Ionicons 
                      name={appointment.type === 'ONLINE' ? 'videocam' : 'person'} 
                      size={20} 
                      color={Colors.primary} 
                    />
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentPatient}>
                      {appointment.patient.user.name}
                    </Text>
                    <Text style={styles.appointmentTime}>
                      {new Date(appointment.dateTime).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.text.secondary} />
              <Text style={styles.emptyText}>Nenhuma consulta agendada</Text>
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Ações Rápidas</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/new-patient')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="person-add" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Novo Paciente</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/schedule')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="calendar-outline" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.actionText}>Agendar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/recipes')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="restaurant-outline" size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.actionText}>Nova Receita</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/patients')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="people-outline" size={24} color={Colors.success} />
              </View>
              <Text style={styles.actionText}>Meus Pacientes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.info} />
              </View>
              <Text style={styles.actionText}>Segurança MFA</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="camera-outline" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.actionText}>Alterar Avatar</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user.name}!</Text>
        <Text style={styles.role}>Meu Acompanhamento</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Bem-vindo ao Nutri Mobile</Text>
        <Text style={styles.cardText}>
          Acompanhe seu plano alimentar, agende consultas e monitore seu progresso.
        </Text>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Ações Rápidas</Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/meal-plan')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="restaurant-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Meu Cardápio</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/appointments')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="calendar-outline" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.actionText}>Consultas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.info} />
            </View>
            <Text style={styles.actionText}>Segurança MFA</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="camera-outline" size={24} color={Colors.warning} />
            </View>
            <Text style={styles.actionText}>Meu Avatar</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Recursos Disponíveis</Text>
        <Text style={styles.cardText}>
          Confira os recursos que seu nutricionista liberou para você na aba de perfil.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  greeting: {
    ...Typography.h2,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  role: {
    ...Typography.body1,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  quickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  nutritionistStats: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  nutritionistStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  adminStatsContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  adminStatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  adminStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  card: {
    margin: Spacing.md,
    marginTop: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  cardLink: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: '500',
  },
  cardText: {
    ...Typography.body1,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    width: '47%',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: {
    ...Typography.body2,
    color: Colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentPatient: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  appointmentTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});
