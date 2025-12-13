import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '@/src/constants';
import { useAuthStore } from '@/src/store/authStore';
import api from '@/src/config/api';

interface Conversation {
  id: string;
  status: string;
  patient: {
    user: {
      id: string;
      name: string;
      avatar: string | null;
    };
  };
  nutritionist: {
    user: {
      id: string;
      name: string;
      avatar: string | null;
    };
  };
  appointment: {
    id: string;
    dateTime: string;
    duration: number;
    status: string;
  } | null;
  unreadCount: number;
  lastMessage: {
    content: string;
    createdAt: string;
    senderRole: string;
  } | null;
  _count: {
    messages: number;
  };
}

export default function ConversationsScreen() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as conversas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const getOtherUser = (conversation: Conversation) => {
    return user?.role === 'NUTRITIONIST'
      ? conversation.patient.user
      : conversation.nutritionist.user;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return Colors.warning;
      case 'ACTIVE':
        return Colors.success;
      case 'COMPLETED':
        return Colors.text.secondary;
      case 'CANCELLED':
        return Colors.error;
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Agendada';
      case 'ACTIVE':
        return 'Em andamento';
      case 'COMPLETED':
        return 'Finalizada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherUser(item);
    const canStart = item.status !== 'COMPLETED' && item.status !== 'CANCELLED';

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => {
          if (canStart) {
            router.push(`/chat/${item.id}`);
          } else {
            Alert.alert('Conversa Finalizada', 'Esta conversa já foi finalizada');
          }
        }}
        disabled={!canStart}
      >
        <View style={styles.avatarContainer}>
          {otherUser.avatar ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{otherUser.name[0]}</Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={Colors.text.secondary} />
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{otherUser.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
            </View>
          </View>

          {item.appointment && (
            <View style={styles.appointmentInfo}>
              <Ionicons name="calendar-outline" size={14} color={Colors.text.secondary} />
              <Text style={styles.appointmentText}>
                {formatDateTime(item.appointment.dateTime)}
              </Text>
            </View>
          )}

          {item.lastMessage ? (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.senderRole === user?.role ? 'Você: ' : ''}
              {item.lastMessage.content}
            </Text>
          ) : (
            <Text style={styles.noMessages}>Nenhuma mensagem ainda</Text>
          )}

          <Text style={styles.messageCount}>
            {item._count.messages} {item._count.messages === 1 ? 'mensagem' : 'mensagens'}
          </Text>
        </View>

        <Ionicons
          name={canStart ? 'chevron-forward' : 'lock-closed'}
          size={24}
          color={Colors.text.secondary}
        />
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Conversas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando conversas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversas</Text>
        <Text style={styles.headerSubtitle}>
          {user?.role === 'NUTRITIONIST'
            ? 'Atenda seus pacientes'
            : 'Suas consultas com o nutricionista'}
        </Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={Colors.text.secondary} />
          <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
          <Text style={styles.emptyText}>
            {user?.role === 'NUTRITIONIST'
              ? 'As conversas aparecerão quando houver consultas agendadas'
              : 'As conversas aparecerão quando você agendar uma consulta'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body1,
    color: Colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  listContent: {
    padding: Spacing.md,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.h3,
    color: Colors.primary,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 11,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    ...Typography.h4,
    color: Colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: '600',
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appointmentText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  lastMessage: {
    ...Typography.body2,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  noMessages: {
    ...Typography.body2,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  messageCount: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});
