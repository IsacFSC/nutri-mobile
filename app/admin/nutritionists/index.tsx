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

interface Nutritionist {
  id: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  crn?: string;
  specialization?: string;
  isActive: boolean;
  _count: {
    patients: number;
    appointments: number;
  };
}

export default function NutritionistsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
  const [filteredNuts, setFilteredNuts] = useState<Nutritionist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadNutritionists();
  }, []);

  useEffect(() => {
    filterNutritionists();
  }, [searchQuery, filterActive, nutritionists]);

  const loadNutritionists = async () => {
    try {
      setLoading(true);
      const response = await api.get('/nutritionists');
      setNutritionists(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar nutricionistas:', error);
      Alert.alert('Erro', 'Não foi possível carregar os nutricionistas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterNutritionists = () => {
    let filtered = nutritionists;

    // Filtrar por status
    if (filterActive === 'active') {
      filtered = filtered.filter((n) => n.isActive);
    } else if (filterActive === 'inactive') {
      filtered = filtered.filter((n) => !n.isActive);
    }

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.user.name.toLowerCase().includes(query) ||
          n.user.email.toLowerCase().includes(query) ||
          n.crn?.toLowerCase().includes(query) ||
          n.organization?.name.toLowerCase().includes(query)
      );
    }

    setFilteredNuts(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNutritionists();
  };

  const renderNutritionist = ({ item }: { item: Nutritionist }) => (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={() => router.push(`/admin/nutritionists/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.nutName}>{item.user.name}</Text>
            {item.crn && <Text style={styles.nutCrn}>{item.crn}</Text>}
          </View>
          <View
            style={[
              styles.statusBadge,
              item.isActive && styles.statusBadgeActive,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {item.isActive ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </View>

        <Text style={styles.nutDetail}>📧 {item.user.email}</Text>
        {item.user.phone && (
          <Text style={styles.nutDetail}>📞 {item.user.phone}</Text>
        )}

        {item.specialization && (
          <Text style={styles.nutSpecialization}>
            Especialização: {item.specialization}
          </Text>
        )}

        {item.organization && (
          <Text style={styles.nutOrganization}>
            🏢 {item.organization.name}
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item._count.patients}</Text>
            <Text style={styles.statLabel}>Pacientes</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item._count.appointments}</Text>
            <Text style={styles.statLabel}>Consultas</Text>
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
        <Text style={styles.title}>Nutricionistas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/admin/nutritionists/new')}
        >
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome, email ou CRN..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterActive === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterActive('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterActive === 'all' && styles.filterButtonTextActive,
            ]}
          >
            Todos ({nutritionists.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterActive === 'active' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterActive('active')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterActive === 'active' && styles.filterButtonTextActive,
            ]}
          >
            Ativos ({nutritionists.filter((n) => n.isActive).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterActive === 'inactive' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterActive('inactive')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterActive === 'inactive' && styles.filterButtonTextActive,
            ]}
          >
            Inativos ({nutritionists.filter((n) => !n.isActive).length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNuts}
        renderItem={renderNutritionist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum nutricionista encontrado</Text>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
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
  nutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  nutCrn: {
    fontSize: 14,
    color: '#4CAF50',
  },
  nutDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  nutSpecialization: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  nutOrganization: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 32,
  },
});
