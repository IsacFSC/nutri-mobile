import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

interface IncomingCallModalProps {
  visible: boolean;
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  visible,
  callerName,
  onAccept,
  onReject,
}) => {
  const acceptPan = useRef(new Animated.ValueXY()).current;
  const rejectPan = useRef(new Animated.ValueXY()).current;
  const [acceptButtonActive, setAcceptButtonActive] = useState(false);
  const [rejectButtonActive, setRejectButtonActive] = useState(false);

  // Reset position when modal opens/closes
  useEffect(() => {
    console.log('[IncomingCallModal] Modal visible:', visible);
    console.log('[IncomingCallModal] Caller name:', callerName);
    
    if (!visible) {
      acceptPan.setValue({ x: 0, y: 0 });
      rejectPan.setValue({ x: 0, y: 0 });
      setAcceptButtonActive(false);
      setRejectButtonActive(false);
    }
  }, [visible]);

  // PanResponder para botão de atender (arrastar para direita)
  const acceptPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setAcceptButtonActive(true);
      },
      onPanResponderMove: (_, gesture) => {
        // Só permite arrastar para direita
        if (gesture.dx > 0) {
          acceptPan.setValue({ x: gesture.dx, y: 0 });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        setAcceptButtonActive(false);
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Completar animação e atender
          Animated.spring(acceptPan, {
            toValue: { x: width, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            acceptPan.setValue({ x: 0, y: 0 });
            onAccept();
          });
        } else {
          // Voltar para posição original
          Animated.spring(acceptPan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // PanResponder para botão de rejeitar (arrastar para esquerda)
  const rejectPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setRejectButtonActive(true);
      },
      onPanResponderMove: (_, gesture) => {
        // Só permite arrastar para esquerda
        if (gesture.dx < 0) {
          rejectPan.setValue({ x: gesture.dx, y: 0 });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        setRejectButtonActive(false);
        if (gesture.dx < -SWIPE_THRESHOLD) {
          // Completar animação e rejeitar
          Animated.spring(rejectPan, {
            toValue: { x: -width, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            rejectPan.setValue({ x: 0, y: 0 });
            onReject();
          });
        } else {
          // Voltar para posição original
          Animated.spring(rejectPan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onShow={() => console.log('[IncomingCallModal] Modal ABERTO na tela')}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Avatar/Icon */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color="#fff" />
            </View>
          </View>

          {/* Caller Info */}
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callType}>Videochamada</Text>

          {/* Hint Text */}
          <Text style={styles.hintText}>Arraste para atender ou recusar</Text>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Reject Button */}
            <View style={styles.buttonWrapper}>
              <Animated.View
                style={[
                  styles.swipeButton,
                  styles.rejectButton,
                  {
                    transform: [{ translateX: rejectPan.x }],
                    opacity: rejectButtonActive ? 0.8 : 1,
                  },
                ]}
                {...rejectPanResponder.panHandlers}
              >
                <Ionicons name="close" size={32} color="#fff" />
              </Animated.View>
              <View style={styles.swipeTrack}>
                <Ionicons name="chevron-back" size={20} color="#F44336" />
                <Ionicons name="chevron-back" size={20} color="#F44336" style={{ marginLeft: -10 }} />
              </View>
              <Text style={styles.buttonLabel}>Recusar</Text>
            </View>

            {/* Accept Button */}
            <View style={styles.buttonWrapper}>
              <View style={styles.swipeTrack}>
                <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
                <Ionicons name="chevron-forward" size={20} color="#4CAF50" style={{ marginLeft: -10 }} />
              </View>
              <Animated.View
                style={[
                  styles.swipeButton,
                  styles.acceptButton,
                  {
                    transform: [{ translateX: acceptPan.x }],
                    opacity: acceptButtonActive ? 0.8 : 1,
                  },
                ]}
                {...acceptPanResponder.panHandlers}
              >
                <Ionicons name="videocam" size={32} color="#fff" />
              </Animated.View>
              <Text style={styles.buttonLabel}>Atender</Text>
            </View>
          </View>

          {/* Quick Actions (Fallback) */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickButton} onPress={onReject}>
              <Text style={styles.quickButtonText}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickButton, styles.quickButtonAccept]} 
              onPress={onAccept}
            >
              <Text style={[styles.quickButtonText, styles.quickButtonTextAccept]}>
                Atender
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  callerName: {
    ...Typography.h2,
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  callType: {
    ...Typography.body1,
    color: '#999',
    marginBottom: Spacing.xl,
  },
  hintText: {
    ...Typography.caption,
    color: '#666',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  buttonWrapper: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  swipeTrack: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  swipeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonLabel: {
    ...Typography.caption,
    color: '#999',
    marginTop: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  quickButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickButtonAccept: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickButtonText: {
    ...Typography.button,
    color: '#fff',
  },
  quickButtonTextAccept: {
    color: '#fff',
  },
});
