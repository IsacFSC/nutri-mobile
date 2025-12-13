import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/src/config/api';
import { Loading } from '@/src/components/common/Loading';
import { Card } from '@/src/components/common/Card';

interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  stats: {
    nutritionistsCount: number;
    patientsCount: number;
  };
}

interface Nutritionist {
  id: string;
  user: {
    name: string;
    email: string;
  };
  organization?: {
    name: string;
  };
  isActive: boolean;
  _count: {
    patients: number;
    appointments: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalNutritionists: 0,
    activeNutritionists: 0,
    totalPatients: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orgsResponse, nutritionistsResponse] = await Promise.all([
        api.get('/organizations'),
        api.get('/nutritionists'),
      ]);

      const orgsData = orgsResponse.data;
      const nutsData = nutritionistsResponse.data;

      setOrganizations(orgsData);
      setNutritionists(nutsData);

      // Calcular estatísticas
      const totalPatients = orgsData.reduce(
        (sum: number, org: Organization) => sum + org.stats.patientsCount,
        0
      );

      const activeNuts = nutsData.filter((n: Nutritionist) => n.isActive).length;

      setStats({
        totalOrgs: orgsData.length,
        totalNutritionists: nutsData.length,
        activeNutritionists: activeNuts,
        totalPatients,
      });
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Painel Administrativo</Text>
        <Text style={styles.subtitle}>Visão geral da plataforma</Text>
      </View>

      {/* Cards de Estatísticas */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalOrgs}</Text>
          <Text style={styles.statLabel}>Organizações</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalNutritionists}</Text>
          <Text style={styles.statLabel}>Nutricionistas</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeNutritionists}</Text>
          <Text style={styles.statLabel}>Ativos</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Pacientes</Text>
        </Card>
      </View>

      {/* Ações Rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/admin/organizations')}
        >
          <Text style={styles.actionButtonIcon}>🏢</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Gerenciar Organizações</Text>
            <Text style={styles.actionButtonSubtitle}>
              {stats.totalOrgs} organização(ões) cadastrada(s)
            </Text>
          </View>
          <Text style={styles.actionButtonArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/admin/nutritionists')}
        >
          <Text style={styles.actionButtonIcon}>👨‍⚕️</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Gerenciar Nutricionistas</Text>
            <Text style={styles.actionButtonSubtitle}>
              {stats.activeNutritionists} de {stats.totalNutritionists} ativos
            </Text>
          </View>
          <Text style={styles.actionButtonArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/patients')}
        >
          <Text style={styles.actionButtonIcon}>👥</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Ver Todos os Pacientes</Text>
            <Text style={styles.actionButtonSubtitle}>
              {stats.totalPatients} paciente(s) total
            </Text>
          </View>
          <Text style={styles.actionButtonArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Organizações Recentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Organizações</Text>
          <TouchableOpacity onPress={() => router.push('/admin/organizations')}>
            <Text style={styles.seeAllLink}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {organizations.slice(0, 3).map((org) => (
          <Card key={org.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{org.name}</Text>
              <Text style={styles.listItemSubtitle}>
                {org.stats.nutritionistsCount} nutricionistas •{' '}
                {org.stats.patientsCount} pacientes
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                org.status === 'ACTIVE' && styles.statusBadgeActive,
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {org.status === 'ACTIVE' ? 'Ativa' : org.status}
              </Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Nutricionistas Recentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutricionistas</Text>
          <TouchableOpacity onPress={() => router.push('/admin/nutritionists')}>
            <Text style={styles.seeAllLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {nutritionists.slice(0, 3).map((nut) => (
          <Card key={nut.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{nut.user.name}</Text>
              <Text style={styles.listItemSubtitle}>
                {nut.organization?.name || 'Sem organização'} •{' '}
                {nut._count.patients} pacientes
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                nut.isActive && styles.statusBadgeActive,
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {nut.isActive ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllLink: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButtonArrow: {
    fontSize: 24,
    color: '#CCC',
    fontWeight: '300',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  statusBadgeActive: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
});
