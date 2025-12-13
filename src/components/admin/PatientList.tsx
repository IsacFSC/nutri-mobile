import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants';
import { router } from 'expo-router';
import api from '../../config/api';
import { useAuthStore } from '../../store/authStore';

interface Patient {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  avatar?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  nutritionistName?: string;
  organizationName?: string;
  lastConsultation?: string;
  lastAppointment?: string;
  appointmentStatus?: string;
  createdAt: string;
  updatedAt: string;
}

interface PatientListProps {
  onPatientPress?: (patient: Patient) => void;
}

export default function PatientList({ onPatientPress }: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuthStore();

  const loadPatients = async (pageNum: number = 1, searchTerm: string = '') => {
    try {
      setLoading(true);
      if (!user?.id) {
        Alert.alert('Erro', 'Usuário não encontrado');
        return;
      }

      // Se for ADMIN, usa a rota /all, senão usa a rota do nutricionista
      const endpoint = user.role === 'ADMIN' 
        ? '/patients/all'
        : `/patients/nutritionist/${user.id}`;

      const response = await api.get(endpoint, {
        params: {
          page: pageNum,
          limit: 10,
          search: searchTerm || undefined,
        },
      });

      if (pageNum === 1) {
        setPatients(response.data.patients);
      } else {
        setPatients([...patients, ...response.data.patients]);
      }
      
      setTotalPages(response.data.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert('Erro', 'Falha ao carregar pacientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatients(1, search);
  }, [search]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPatients(1, search);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      loadPatients(page + 1, search);
    }
  };

  const handleDeletePatient = (patientId: string, patientName: string) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir o paciente ${patientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/patients/${patientId}`);
              Alert.alert('Sucesso', 'Paciente excluído com sucesso');
              loadPatients(1, search);
            } catch (error) {
              console.error('Error deleting patient:', error);
              Alert.alert('Erro', 'Falha ao excluir paciente');
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = (patient: Patient) => {
    // TODO: Implementar sistema de mensagens
    Alert.alert('Em breve', 'Sistema de mensagens será implementado em breve');
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const renderPatientCard = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPatientPress?.(item)}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.cardContent}>
          {/* Coluna fixa - Nome e CPF */}
          <View style={styles.fixedColumn}>
            <View style={styles.avatarContainer}>
              {item.avatar ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color={Colors.text.secondary} />
                </View>
              )}
            </View>
            <View style={styles.fixedInfo}>
              <Text style={styles.patientName}>{item.name}</Text>
              <Text style={styles.patientCPF}>CPF: {item.cpf || 'N/A'}</Text>
            </View>
          </View>

          {/* Colunas roláveis */}
          <View style={styles.scrollableColumns}>
            {/* Nutricionista (apenas para ADMIN) */}
            {user?.role === 'ADMIN' && (
              <View style={styles.dataColumn}>
                <Text style={styles.columnLabel}>Nutricionista</Text>
                <Text style={styles.columnValue}>{item.nutritionistName || 'N/A'}</Text>
              </View>
            )}

            {/* Organização (apenas para ADMIN) */}
            {user?.role === 'ADMIN' && (
              <View style={styles.dataColumn}>
                <Text style={styles.columnLabel}>Organização</Text>
                <Text style={styles.columnValue}>{item.organizationName || 'N/A'}</Text>
              </View>
            )}

            {/* Telefone */}
            <View style={styles.dataColumn}>
              <Text style={styles.columnLabel}>Telefone</Text>
              <Text style={styles.columnValue}>{item.phone || 'N/A'}</Text>
            </View>

            {/* Peso */}
            <View style={styles.dataColumn}>
              <Text style={styles.columnLabel}>Peso</Text>
              <Text style={styles.columnValue}>
                {item.weight ? `${item.weight} kg` : 'N/A'}
              </Text>
            </View>

            {/* Altura */}
            <View style={styles.dataColumn}>
              <Text style={styles.columnLabel}>Altura</Text>
              <Text style={styles.columnValue}>
                {item.height ? `${item.height} cm` : 'N/A'}
              </Text>
            </View>

            {/* IMC */}
            <View style={styles.dataColumn}>
              <Text style={styles.columnLabel}>IMC</Text>
              <Text style={styles.columnValue}>
                {item.bmi ? item.bmi.toFixed(1) : 'N/A'}
              </Text>
            </View>

            {/* Data de cadastro */}
            <View style={styles.dataColumn}>
              <Text style={styles.columnLabel}>Cadastro</Text>
              <Text style={styles.columnValue}>{formatDate(item.createdAt)}</Text>
            </View>

            {/* Última consulta */}
            <View style={styles.dataColumn}>
              <Text style={styles.columnLabel}>Última Consulta</Text>
              <Text style={styles.columnValue}>
                {formatDate(item.lastConsultation)}
              </Text>
            </View>
          </View>

          {/* Ações */}
          <View style={styles.actionsColumn}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSendMessage(item)}
            >
              <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeletePatient(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barra de pesquisa */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={Colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.text.secondary}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Legenda das colunas */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          {patients.length} paciente{patients.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Lista de pacientes */}
      <FlatList
        data={patients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.emptyText}>
              {search ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </Text>
            {!search && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/new-patient')}
              >
                <Text style={styles.addButtonText}>Adicionar Paciente</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.text.primary,
    fontSize: 16,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500' as const,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  fixedColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    marginRight: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  fixedInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  patientCPF: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  scrollableColumns: {
    flexDirection: 'row',
  },
  dataColumn: {
    marginRight: 16,
    minWidth: 100,
  },
  columnLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  columnValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500' as const,
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
