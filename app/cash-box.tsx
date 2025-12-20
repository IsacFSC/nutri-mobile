import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '@/src/constants';
import api from '@/src/config/api';

interface Transaction {
  id: string;
  amount: number;
  netAmount: number;
  adminFeeAmount: number;
  paymentMethod: string;
  category: string;
  proofNumber: string | null;
  createdAt: string;
  patient: {
    user: {
      name: string;
    };
  };
}

interface Balance {
  totalIncome: number;
  totalExpense: number;
  totalAdminFee: number;
  netIncome: number;
  balance: number;
  transactionsCount: number;
}

export default function CashBoxScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('month');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      let startDate: Date | undefined;

      if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      }

      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }

      const [transactionsRes, balanceRes] = await Promise.all([
        api.get(`/financial/transactions?${params}`),
        api.get(`/financial/balance?${params}`),
      ]);

      setTransactions(transactionsRes.data);
      setBalance(balanceRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      PIX: 'PIX',
      CREDIT_CARD: 'Cartão de Crédito',
      DEBIT_CARD: 'Cartão de Débito',
      CASH: 'Dinheiro',
      BANK_TRANSFER: 'Transferência',
    };
    return methods[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      PIX: 'flash',
      CREDIT_CARD: 'card',
      DEBIT_CARD: 'card-outline',
      CASH: 'cash',
      BANK_TRANSFER: 'swap-horizontal',
    };
    return icons[method] || 'cash';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caixa</Text>
        <TouchableOpacity onPress={() => router.push('/register-payment')} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color={Colors.text.inverse} />
        </TouchableOpacity>
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[styles.periodButtonText, period === 'week' && styles.periodButtonTextActive]}>
            7 Dias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}>
            Mês
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'all' && styles.periodButtonActive]}
          onPress={() => setPeriod('all')}
        >
          <Text style={[styles.periodButtonText, period === 'all' && styles.periodButtonTextActive]}>
            Tudo
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {balance && (
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Saldo Líquido</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(balance.balance)}</Text>
              
              <View style={styles.balanceDetails}>
                <View style={styles.balanceDetailItem}>
                  <Ionicons name="arrow-down-circle" size={20} color={Colors.success} />
                  <Text style={styles.balanceDetailLabel}>Receita Bruta</Text>
                  <Text style={styles.balanceDetailValue}>{formatCurrency(balance.totalIncome)}</Text>
                </View>
                
                <View style={styles.balanceDetailItem}>
                  <Ionicons name="remove-circle" size={20} color={Colors.warning} />
                  <Text style={styles.balanceDetailLabel}>Taxa Admin (10%)</Text>
                  <Text style={styles.balanceDetailValue}>-{formatCurrency(balance.totalAdminFee)}</Text>
                </View>
                
                <View style={styles.balanceDetailItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  <Text style={styles.balanceDetailLabel}>Receita Líquida</Text>
                  <Text style={[styles.balanceDetailValue, { color: Colors.primary }]}>
                    {formatCurrency(balance.netIncome)}
                  </Text>
                </View>
              </View>

              <View style={styles.transactionCount}>
                <Text style={styles.transactionCountText}>
                  {balance.transactionsCount} transação(ões) no período
                </Text>
              </View>
            </View>
          )}

          <View style={styles.transactionsList}>
            <Text style={styles.transactionsTitle}>Transações</Text>
            
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={48} color={Colors.text.secondary} />
                <Text style={styles.emptyStateText}>
                  Nenhuma transação neste período
                </Text>
              </View>
            ) : (
              transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionIcon}>
                      <Ionicons
                        name={getPaymentMethodIcon(transaction.paymentMethod) as any}
                        size={24}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionPatient}>
                        {transaction.patient.user.name}
                      </Text>
                      <Text style={styles.transactionMethod}>
                        {getPaymentMethodLabel(transaction.paymentMethod)}
                        {transaction.proofNumber && ` • ${transaction.proofNumber}`}
                      </Text>
                    </View>
                    <View style={styles.transactionAmounts}>
                      <Text style={styles.transactionAmount}>
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <Text style={styles.transactionNetAmount}>
                        Líquido: {formatCurrency(transaction.netAmount)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.transactionFooter}>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                    <Text style={styles.transactionFee}>
                      Taxa: {formatCurrency(transaction.adminFeeAmount)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  addButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.inverse,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodButtonText: {
    ...Typography.button,
    color: Colors.text.secondary,
  },
  periodButtonTextActive: {
    color: Colors.text.inverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  balanceLabel: {
    ...Typography.body2,
    color: Colors.text.inverse,
    opacity: 0.8,
  },
  balanceAmount: {
    ...Typography.h1,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  balanceDetails: {
    gap: Spacing.md,
  },
  balanceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balanceDetailLabel: {
    flex: 1,
    ...Typography.body2,
    color: Colors.text.inverse,
  },
  balanceDetailValue: {
    ...Typography.body1,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  transactionCount: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  transactionCountText: {
    ...Typography.body2,
    color: Colors.text.inverse,
    textAlign: 'center',
    opacity: 0.8,
  },
  transactionsList: {
    padding: Spacing.md,
  },
  transactionsTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    ...Typography.body1,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  transactionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionPatient: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  transactionMethod: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...Typography.body1,
    color: Colors.success,
    fontWeight: 'bold',
  },
  transactionNetAmount: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  transactionDate: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  transactionFee: {
    ...Typography.caption,
    color: Colors.warning,
  },
});
