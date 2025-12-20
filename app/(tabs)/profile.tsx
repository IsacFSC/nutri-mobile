import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card, Button } from '@/src/components/common';
import { Colors, Typography, Spacing } from '@/src/constants';
import { useAuthStore } from '@/src/store/authStore';
import { UserRole } from '@/src/types';
import DashboardService from '@/src/services/dashboard.service';

interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  color?: string;
  onPress: () => void;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ patientsCount: 0, appointmentsCount: 0, recipesCount: 0 });
  const isNutritionist = user?.role === UserRole.NUTRITIONIST;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isNutritionistOrAdmin = isNutritionist || isAdmin;

  useEffect(() => {
    if (isNutritionistOrAdmin) {
      loadStats();
    }
  }, [isNutritionistOrAdmin]);

  const loadStats = async () => {
    try {
      if (user?.role === 'NUTRITIONIST') {
        const data = await DashboardService.getNutritionistStats();
        setStats({
          patientsCount: data.activePatientsCount,
          appointmentsCount: data.todayAppointmentsCount,
          recipesCount: data.recipesCount,
        });
      } else if (user?.role === 'ADMIN') {
        const data = await DashboardService.getAdminStats();
        setStats({
          patientsCount: data.patientsCount,
          appointmentsCount: data.totalAppointments,
          recipesCount: data.recipesCount,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await logout();
              // Redirecionar para login após logout
              router.replace('/login');
            } catch (error: any) {
              Alert.alert('Erro', 'Não foi possível fazer logout. Tente novamente.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChangeAvatar = () => {
    Alert.alert('Foto de Perfil', 'Escolha uma opção:', [
      { text: 'Tirar Foto', onPress: () => {} },
      { text: 'Escolher da Galeria', onPress: () => {} },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const menuItems = isNutritionist
    ? [
        // Menu para Nutricionistas
        {
          icon: 'person-outline',
          title: 'Dados Pessoais',
          subtitle: 'Editar informações do perfil',
          onPress: () => router.push('/edit-profile'),
        },
        {
          icon: 'briefcase-outline',
          title: 'Dados Profissionais',
          subtitle: 'CRN, certificados, experiência',
          color: Colors.primary,
          onPress: () => router.push('/edit-professional-info'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Autenticação MFA',
          subtitle: 'Configurar autenticação de dois fatores',
          color: Colors.info,
          onPress: () => Alert.alert('MFA', 'Funcionalidade em desenvolvimento'),
        },
        {
          icon: 'camera-outline',
          title: 'Alterar Avatar',
          subtitle: 'Atualizar foto do perfil',
          color: Colors.warning,
          onPress: handleChangeAvatar,
        },
        {
          icon: 'lock-closed-outline',
          title: 'Segurança e Privacidade',
          subtitle: 'Alterar senha, logs de auditoria',
          onPress: () => {},
        },
        {
          icon: 'document-text-outline',
          title: 'LGPD - Meus Dados',
          subtitle: 'Exportar, visualizar ou excluir dados',
          color: Colors.success,
          onPress: () => Alert.alert('LGPD', 'Exportar dados, visualizar logs de auditoria ou solicitar exclusão'),
        },
        {
          icon: 'notifications-outline',
          title: 'Notificações',
          subtitle: 'Gerenciar preferências de notificação',
          onPress: () => {},
        },
        {
          icon: 'stats-chart-outline',
          title: 'Relatórios',
          subtitle: 'Tabela de atendimentos',
          color: Colors.info,
          onPress: () => router.push('/reports'),
        },
        {
          icon: 'wallet-outline',
          title: 'Financeiro - Caixa',
          subtitle: 'Pagamentos e movimentações',
          color: Colors.success,
          onPress: () => router.push('/cash-box'),
        },
        {
          icon: 'help-circle-outline',
          title: 'Ajuda e Suporte',
          subtitle: 'Central de ajuda e tutoriais',
          onPress: () => {},
        },
      ]
    : isAdmin
    ? [
        // Menu para Administradores
        {
          icon: 'person-outline',
          title: 'Dados Pessoais',
          subtitle: 'Editar informações do perfil',
          onPress: () => router.push('/edit-profile'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Autenticação MFA',
          subtitle: 'Configurar autenticação de dois fatores',
          color: Colors.info,
          onPress: () => Alert.alert('MFA', 'Funcionalidade em desenvolvimento'),
        },
        {
          icon: 'camera-outline',
          title: 'Alterar Avatar',
          subtitle: 'Atualizar foto do perfil',
          color: Colors.warning,
          onPress: handleChangeAvatar,
        },
        {
          icon: 'business-outline',
          title: 'Gerenciar Organizações',
          subtitle: 'Administrar clínicas e organizações',
          color: Colors.primary,
          onPress: () => router.push('/admin/organizations'),
        },
        {
          icon: 'people-outline',
          title: 'Gerenciar Nutricionistas',
          subtitle: 'Administrar profissionais',
          color: Colors.primary,
          onPress: () => router.push('/admin/nutritionists'),
        },
        {
          icon: 'stats-chart-outline',
          title: 'Relatórios',
          subtitle: 'Tabela de atendimentos gerais',
          color: Colors.info,
          onPress: () => router.push('/reports'),
        },
        {
          icon: 'wallet-outline',
          title: 'Financeiro - Caixa',
          subtitle: 'Visão geral financeira',
          color: Colors.success,
          onPress: () => router.push('/cash-box'),
        },
        {
          icon: 'lock-closed-outline',
          title: 'Segurança e Privacidade',
          subtitle: 'Alterar senha, logs de auditoria',
          onPress: () => {},
        },
        {
          icon: 'document-text-outline',
          title: 'LGPD - Meus Dados',
          subtitle: 'Exportar, visualizar ou excluir dados',
          color: Colors.success,
          onPress: () => Alert.alert('LGPD', 'Exportar dados, visualizar logs de auditoria ou solicitar exclusão'),
        },
        {
          icon: 'notifications-outline',
          title: 'Notificações',
          subtitle: 'Gerenciar preferências de notificação',
          onPress: () => {},
        },
        {
          icon: 'help-circle-outline',
          title: 'Ajuda e Suporte',
          subtitle: 'Central de ajuda e tutoriais',
          onPress: () => {},
        },
      ]
    : [
        // Menu para Pacientes
        {
          icon: 'person-outline',
          title: 'Dados Pessoais',
          subtitle: 'Editar informações do perfil',
          onPress: () => router.push('/edit-profile'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Autenticação MFA',
          subtitle: 'Ativar proteção com dois fatores',
          color: Colors.info,
          onPress: () => Alert.alert('MFA', 'Funcionalidade em desenvolvimento'),
        },
        {
          icon: 'camera-outline',
          title: 'Alterar Avatar',
          subtitle: 'Atualizar foto do perfil',
          color: Colors.warning,
          onPress: handleChangeAvatar,
        },
        {
          icon: 'lock-closed-outline',
          title: 'Segurança',
          subtitle: 'Alterar senha e configurações',
          onPress: () => {},
        },
        {
          icon: 'document-text-outline',
          title: 'LGPD - Meus Dados',
          subtitle: 'Ver, exportar ou excluir meus dados',
          color: Colors.success,
          onPress: () => Alert.alert('LGPD', 'Seus dados estão protegidos conforme LGPD'),
        },
        {
          icon: 'settings-outline',
          title: 'Recursos Liberados',
          subtitle: 'Ver funcionalidades disponíveis',
          onPress: () => {},
        },
        {
          icon: 'notifications-outline',
          title: 'Notificações',
          subtitle: 'Gerenciar preferências',
          onPress: () => {},
        },
        {
          icon: 'lock-closed-outline',
          title: 'Segurança',
          subtitle: 'Alterar senha',
          onPress: () => {},
        },
        {
          icon: 'help-circle-outline',
          title: 'Ajuda',
          subtitle: 'Central de ajuda',
          onPress: () => {},
        },
      ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleChangeAvatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={Colors.text.inverse} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={16} color={Colors.text.inverse} />
            </View>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        
        {isNutritionist && user?.nutritionist && (
          <View style={styles.professionalInfo}>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
              <Text style={styles.badgeText}>CRN {user.nutritionist.crn}</Text>
            </View>
            {user.nutritionist.specialization && (
              <Text style={styles.specialization}>{user.nutritionist.specialization}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        {isNutritionist && (
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>Visão Geral</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{stats.patientsCount}</Text>
                <Text style={styles.statLabel}>Pacientes</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{stats.appointmentsCount}</Text>
                <Text style={styles.statLabel}>Consultas</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="restaurant" size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{stats.recipesCount}</Text>
                <Text style={styles.statLabel}>Receitas</Text>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={item.color || Colors.primary} 
                />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          ))}
        </Card>

        <Button
          title="Sair"
          onPress={handleLogout}
          loading={isLoading}
          style={styles.logoutButton}
          variant="outline"
        />

        <Text style={styles.version}>Versão 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xl + 20,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.surface,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    borderWidth: 4,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  userName: {
    ...Typography.h2,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body2,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  professionalInfo: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    gap: Spacing.xs,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  specialization: {
    ...Typography.body2,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
  },
  content: {
    padding: Spacing.md,
  },
  statsCard: {
    marginBottom: Spacing.md,
  },
  statsTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  menuCard: {
    padding: 0,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  logoutButton: {
    marginBottom: Spacing.md,
  },
  version: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
});
