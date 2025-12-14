import api from '@/src/config/api';

export interface VideoCall {
  id: string;
  conversationId: string;
  roomName: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  status: 'WAITING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  initiatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartVideoCallResponse {
  videoCall: VideoCall;
}

export interface VideoCallHistoryResponse {
  videoCalls: VideoCall[];
}

export class VideoCallService {
  // Iniciar uma nova videochamada
  static async startVideoCall(conversationId: string): Promise<StartVideoCallResponse> {
    const response = await api.post<StartVideoCallResponse>('/video-calls/start', {
      conversationId,
    });
    return response.data;
  }

  // Entrar em uma videochamada existente
  static async joinVideoCall(videoCallId: string): Promise<StartVideoCallResponse> {
    const response = await api.post<StartVideoCallResponse>(`/video-calls/${videoCallId}/join`);
    return response.data;
  }

  // Encerrar uma videochamada
  static async endVideoCall(videoCallId: string): Promise<StartVideoCallResponse> {
    const response = await api.post<StartVideoCallResponse>(`/video-calls/${videoCallId}/end`);
    return response.data;
  }

  // Buscar videochamada ativa de uma conversa
  static async getActiveVideoCall(conversationId: string): Promise<{ videoCall: VideoCall | null }> {
    const response = await api.get<{ videoCall: VideoCall | null }>(
      `/video-calls/conversation/${conversationId}/active`
    );
    return response.data;
  }

  // Buscar histórico de videochamadas de uma conversa
  static async getVideoCallHistory(conversationId: string): Promise<VideoCallHistoryResponse> {
    const response = await api.get<VideoCallHistoryResponse>(
      `/video-calls/conversation/${conversationId}/history`
    );
    return response.data;
  }
}
