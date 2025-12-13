import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants';
import api from '@/src/config/api';

interface Subscription {
  id: string;
  organization: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  plan: string;
  status: string;
  monthlyPrice: number;
  billingDay: number;
  gracePeriodEndsAt: string | null;
  daysOverdue: number;
  lastPayment: {
    id: string;
    dueDate: string;
    status: string;
    amount: number;
  } | null;
  _count: {
    payments: number;
    alerts: number;
  };
}

export default function PaymentsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'OVERDUE'>('ALL');
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [gracePeriodDays, setGracePeriodDays] = useState('7');

  useEffect(() => {
    loadSubscriptions();
  }, [selectedFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedFilter === 'ACTIVE' || selectedFilter === 'SUSPENDED') {
        params.status = selectedFilter;
      }
      
      const response = await api.get('/payments/subscriptions', { params });
      
      let data = response.data;
      if (selectedFilter === 'OVERDUE') {
        data = data.filter((sub: Subscription) => sub.daysOverdue > 0);
      }
      
      setSubscriptions(data);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as assinaturas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubscriptions();
  };

  const handleSendAlert = async () => {
    if (!selectedSubscription || !alertMessage.trim()) {
      Alert.alert('Erro', 'Preencha a mensagem de alerta');
      return;
    }

    try {
      await api.post('/payments/alerts', {
        subscriptionId: selectedSubscription.id,
        message: alertMessage,
        daysOverdue: selectedSubscription.daysOverdue,
      });

      Alert.alert('Sucesso', 'Alerta enviado com sucesso!');
      setAlertModalVisible(false);
      setAlertMessage('');
      loadSubscriptions();
    } catch (error) {
      console.error('Erro ao enviar alerta:', error);
      Alert.alert('Erro', 'Não foi possível enviar o alerta');
    }
  };

  const handleSetGracePeriod = async (subscription: Subscription) => {
    Alert.prompt(
      'Período de Carência',
      'Quantos dias de carência deseja conceder?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async (days) => {
            try {
              await api.put(`/payments/subscriptions/${subscription.id}`, {
                gracePeriodDays: parseInt(days || '0'),
              });
              Alert.alert('Sucesso', 'Período de carência atualizado');
              loadSubscriptions();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível atualizar');
            }
          },
        },
      ],
      'plain-text',
      gracePeriodDays
    );
  };

  const handleSuspendSubscription = async (subscription: Subscription) => {
    Alert.alert(
      'Confirmar Suspensão',
      `Deseja suspender a assinatura de ${subscription.organization.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Suspender',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/payments/subscriptions/${subscription.id}`, {
                status: 'SUSPENDED',
              });
              Alert.alert('Sucesso', 'Assinatura suspensa');
              loadSubscriptions();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível suspender');
            }
          },
        },
      ]
    );
  };

  const handleReactivateSubscription = async (subscription: Subscription) => {
    Alert.alert(
      'Confirmar Reativação',
      `Deseja reativar a assinatura de ${subscription.organization.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reativar',
          onPress: async () => {
            try {
              await api.put(`/payments/subscriptions/${subscription.id}`, {
                status: 'ACTIVE',
                gracePeriodDays: 0,
              });
              Alert.alert('Sucesso', 'Assinatura reativada');
              loadSubscriptions();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível reativar');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return Colors.success;
      case 'SUSPENDED':
        return Colors.error;
      case 'CANCELLED':
        return Colors.text.secondary;
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativa';
      case 'SUSPENDED':
        return 'Suspensa';
      case 'CANCELLED':
        return 'Cancelada';
      case 'EXPIRED':
        return 'Expirada';
      default:
        return status;
    }
  };

  const renderSubscriptionCard = (subscription: Subscription) => (
    <View key={subscription.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.orgInfo}>
          <Text style={styles.orgName}>{subscription.organization.name}</Text>
          <Text style={styles.orgPlan}>Plano: {subscription.plan}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) }]}>
          <Text style={styles.statusText}>{getStatusText(subscription.status)}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color={Colors.text.secondary} />
          <Text style={styles.infoText}>
            R$ {subscription.monthlyPrice.toFixed(2)}/mês
          </Text>
        </View>

        {subscription.daysOverdue > 0 && (
          <View style={[styles.infoRow, styles.overdueRow]}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={[styles.infoText, { color: Colors.error }]}>
              {subscription.daysOverdue} dias em atraso
            </Text>
          </View>
        )}

        {subscription.gracePeriodEndsAt && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={Colors.warning} />
            <Text style={[styles.infoText, { color: Colors.warning }]}>
              Carência até {new Date(subscription.gracePeriodEndsAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            {subscription._count.payments} pagamentos
          </Text>
          <Text style={styles.statText}>
            {subscription._count.alerts} alertas enviados
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        {subscription.daysOverdue > 0 && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.alertBtn]}
            onPress={() => {
              setSelectedSubscription(subscription);
              setAlertMessage(
                `Prezado(a),\n\nIdentificamos que o pagamento da sua assinatura está em atraso há ${subscription.daysOverdue} dias.\n\nPor favor, regularize sua situação para evitar a suspensão do acesso.\n\nValor: R$ ${subscription.monthlyPrice.toFixed(2)}`
              );
              setAlertModalVisible(true);
            }}
          >
            <Ionicons name="mail-outline" size={18} color={Colors.text.inverse} />
            <Text style={styles.actionBtnText}>Enviar Alerta</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, styles.graceBtn]}
          onPress={() => handleSetGracePeriod(subscription)}
        >
          <Ionicons name="time-outline" size={18} color={Colors.text.inverse} />
          <Text style={styles.actionBtnText}>Carência</Text>
        </TouchableOpacity>

        {subscription.status === 'ACTIVE' ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.suspendBtn]}
            onPress={() => handleSuspendSubscription(subscription)}
          >
            <Ionicons name="pause-outline" size={18} color={Colors.text.inverse} />
            <Text style={styles.actionBtnText}>Suspender</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.reactivateBtn]}
            onPress={() => handleReactivateSubscription(subscription)}
          >
            <Ionicons name="play-outline" size={18} color={Colors.text.inverse} />
            <Text style={styles.actionBtnText}>Reativar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestão de Pagamentos</Text>
        <Text style={styles.headerSubtitle}>Controle de assinaturas e alertas</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['ALL', 'ACTIVE', 'SUSPENDED', 'OVERDUE'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
              {filter === 'ALL' ? 'Todas' : filter === 'ACTIVE' ? 'Ativas' : filter === 'SUSPENDED' ? 'Suspensas' : 'Em Atraso'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.emptyText}>Nenhuma assinatura encontrada</Text>
          </View>
        ) : (
          subscriptions.map(renderSubscriptionCard)
        )}
      </ScrollView>

      {/* Modal de Envio de Alerta */}
      <Modal
        visible={alertModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enviar Alerta de Pagamento</Text>
              <TouchableOpacity onPress={() => setAlertModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {selectedSubscription && (
              <Text style={styles.modalSubtitle}>
                Para: {selectedSubscription.organization.name}
              </Text>
            )}

            <TextInput
              style={styles.messageInput}
              value={alertMessage}
              onChangeText={setAlertMessage}
              placeholder="Digite a mensagem do alerta..."
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={8}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setAlertModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.sendBtn]} onPress={handleSendAlert}>
                <Text style={styles.sendBtnText}>Enviar Alerta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: 50,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.inverse,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.body2,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  filterScroll: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  loadingText: {
    ...Typography.body1,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl * 2,
  },
  emptyText: {
    ...Typography.body1,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  orgPlan: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  overdueRow: {
    backgroundColor: '#FEE',
    padding: Spacing.xs,
    borderRadius: 6,
  },
  infoText: {
    ...Typography.body2,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  alertBtn: {
    backgroundColor: Colors.primary,
  },
  graceBtn: {
    backgroundColor: Colors.warning,
  },
  suspendBtn: {
    backgroundColor: Colors.error,
  },
  reactivateBtn: {
    backgroundColor: Colors.success,
  },
  actionBtnText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  modalSubtitle: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  messageInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    ...Typography.body1,
    color: Colors.text.primary,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
  },
  cancelBtnText: {
    ...Typography.button,
    color: Colors.text.primary,
  },
  sendBtnText: {
    ...Typography.button,
    color: Colors.text.inverse,
  },
});
