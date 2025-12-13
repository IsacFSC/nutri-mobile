import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants';
import { useAuthStore } from '@/src/store/authStore';
import api from '@/src/config/api';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  type: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

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
  messages: Message[];
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canStart, setCanStart] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const pollInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadConversation();
    checkCanStart();

    // Poll de mensagens a cada 3 segundos
    pollInterval.current = setInterval(() => {
      loadConversation(true);
    }, 3000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [id]);

  const loadConversation = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get(`/conversations/${id}`);
      setConversation(response.data);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
      if (!silent) {
        Alert.alert('Erro', 'Não foi possível carregar a conversa');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const checkCanStart = async () => {
    try {
      const response = await api.get(`/conversations/${id}/can-start`);
      setCanStart(response.data.canStart);
      
      if (!response.data.canStart && response.data.minutesUntil) {
        const minutes = response.data.minutesUntil;
        if (minutes > 60) {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          setTimeUntilStart(`${hours}h ${mins}min`);
        } else {
          setTimeUntilStart(`${minutes} minutos`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar horário:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await api.post(`/conversations/${id}/messages`, {
        content: newMessage.trim(),
        type: 'TEXT',
      });

      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
      
      // Scroll para o final
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      
      if (error.response?.data?.canStartAt) {
        Alert.alert(
          'Consulta ainda não iniciada',
          error.response.data.message,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível enviar a mensagem');
      }
    } finally {
      setSending(false);
    }
  };

  const handleEndConversation = () => {
    Alert.alert(
      'Finalizar Consulta',
      'Deseja realmente finalizar esta consulta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/conversations/${id}/end`);
              Alert.alert('Sucesso', 'Consulta finalizada', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível finalizar a consulta');
            }
          },
        },
      ]
    );
  };

  const getOtherUser = () => {
    if (!conversation) return null;
    return user?.role === 'NUTRITIONIST'
      ? conversation.patient.user
      : conversation.nutritionist.user;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.id;

    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        {!isMyMessage && (
          <Text style={styles.senderName}>{item.sender.name}</Text>
        )}
        <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
          {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carregando...</Text>
        </View>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversa não encontrada</Text>
        </View>
      </View>
    );
  }

  const otherUser = getOtherUser();
  const isActive = conversation.status === 'ACTIVE';
  const isScheduled = conversation.status === 'SCHEDULED';
  const canSendMessage = isActive || (isScheduled && canStart);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{otherUser?.name}</Text>
          {conversation.appointment && (
            <Text style={styles.headerSubtitle}>
              Consulta: {new Date(conversation.appointment.dateTime).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
        {user?.role === 'NUTRITIONIST' && isActive && (
          <TouchableOpacity onPress={handleEndConversation} style={styles.endButton}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>

      {!canSendMessage && isScheduled && (
        <View style={styles.blockedBanner}>
          <Ionicons name="lock-closed" size={20} color={Colors.warning} />
          <Text style={styles.blockedText}>
            A consulta será liberada em {timeUntilStart}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.text.secondary} />
            <Text style={styles.emptyText}>
              {canSendMessage ? 'Inicie a conversa' : 'Aguarde o horário da consulta'}
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={canSendMessage ? 'Digite sua mensagem...' : 'Aguarde o horário'}
          placeholderTextColor={Colors.text.secondary}
          multiline
          maxLength={1000}
          editable={canSendMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!canSendMessage || !newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!canSendMessage || !newMessage.trim() || sending}
        >
          <Ionicons
            name="send"
            size={24}
            color={canSendMessage && newMessage.trim() && !sending ? Colors.text.inverse : Colors.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: Colors.primary,
    paddingTop: 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  endButton: {
    marginLeft: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text.inverse,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9E6',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  blockedText: {
    ...Typography.body2,
    color: Colors.warning,
    fontWeight: '600',
  },
  messagesContainer: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  senderName: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    ...Typography.body1,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  myMessageText: {
    color: Colors.text.inverse,
  },
  messageTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: Colors.text.inverse,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body1,
    color: Colors.text.primary,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.background,
  },
});
