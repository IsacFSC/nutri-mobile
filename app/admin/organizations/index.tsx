import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/src/config/api';
import { Loading } from '@/src/components/common/Loading';
import { Card } from '@/src/components/common/Card';

interface Organization {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  city?: string;
  state?: string;
  status: string;
  stats: {
    nutritionistsCount: number;
    patientsCount: number;
  };
  maxNutritionists: number;
  maxPatients: number;
}

export default function OrganizationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [searchQuery, organizations]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizations');
      setOrganizations(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar organizações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as organizações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrganizations = () => {
    if (!searchQuery) {
      setFilteredOrgs(organizations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        org.slug.toLowerCase().includes(query) ||
        org.cnpj?.includes(query) ||
        org.city?.toLowerCase().includes(query)
    );
    setFilteredOrgs(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrganizations();
  };

  const renderOrganization = ({ item }: { item: Organization }) => (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={() => router.push(`/admin/organizations/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.orgName}>{item.name}</Text>
            <Text style={styles.orgSlug}>@{item.slug}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.status === 'ACTIVE' && styles.statusBadgeActive,
              item.status === 'SUSPENDED' && styles.statusBadgeSuspended,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {item.status === 'ACTIVE' && 'Ativa'}
              {item.status === 'SUSPENDED' && 'Suspensa'}
              {item.status === 'INACTIVE' && 'Inativa'}
            </Text>
          </View>
        </View>

        {item.cnpj && (
          <Text style={styles.orgDetail}>CNPJ: {item.cnpj}</Text>
        )}

        {(item.city || item.state) && (
          <Text style={styles.orgDetail}>
            {item.city}
            {item.city && item.state && ', '}
            {item.state}
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.stats.nutritionistsCount}</Text>
            <Text style={styles.statLabel}>Nutricionistas</Text>
            <Text style={styles.statLimit}>
              Limite: {item.maxNutritionists}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.stats.patientsCount}</Text>
            <Text style={styles.statLabel}>Pacientes</Text>
            <Text style={styles.statLimit}>Limite: {item.maxPatients}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Organizações</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/admin/organizations/new')}
        >
          <Text style={styles.addButtonText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome, CNPJ ou cidade..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredOrgs}
        renderItem={renderOrganization}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma organização encontrada</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  orgName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orgSlug: {
    fontSize: 14,
    color: '#4CAF50',
  },
  orgDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statLimit: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
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
  statusBadgeSuspended: {
    backgroundColor: '#FFEBEE',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 32,
  },
});
