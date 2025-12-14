import api from '@/src/config/api';
import {
  Appointment,
  AppointmentStatus,
  TimeSlot,
} from '@/src/types';

export class AppointmentService {
  /**
   * RF 2.1 - Cria uma nova consulta
   */
  static async createAppointment(
    patientId: string,
    nutritionistId: string,
    dateTime: Date,
    duration: number = 60,
    notes?: string
  ): Promise<Appointment> {
    try {
      const response = await api.post<Appointment>('/appointments', {
        patientId,
        nutritionistId,
        dateTime: dateTime.toISOString(),
        duration,
        notes,
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao criar consulta';
      throw new Error(message);
    }
  }

  /**
   * Busca todas as consultas (filtradas pelo role do usuário)
   */
  static async getAppointments(): Promise<Appointment[]> {
    try {
      const response = await api.get<Appointment[]>('/appointments');
      return response.data || [];
    } catch (error: any) {
      console.error('AppointmentService.getAppointments error:', error);
      const message = error.response?.data?.error || 'Erro ao buscar consultas';
      const enhancedError: any = new Error(message);
      enhancedError.response = error.response;
      throw enhancedError;
    }
  }

  /**
   * Busca uma consulta específica por ID
   */
  static async getAppointmentById(id: string): Promise<Appointment> {
    try {
      const response = await api.get<Appointment>(`/appointments/${id}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao buscar consulta';
      throw new Error(message);
    }
  }

  /**
   * Atualiza status e dados da consulta
   */
  static async updateAppointment(
    appointmentId: string,
    data: {
      status?: AppointmentStatus;
      notes?: string;
      videoRoomUrl?: string;
    }
  ): Promise<Appointment> {
    try {
      const response = await api.put<Appointment>(`/appointments/${appointmentId}`, data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao atualizar consulta';
      throw new Error(message);
    }
  }

  /**
   * Cancela consulta
   */
  static async cancelAppointment(appointmentId: string): Promise<Appointment> {
    try {
      const response = await api.delete<Appointment>(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao cancelar consulta';
      throw new Error(message);
    }
  }

  /**
   * Busca horários disponíveis para um nutricionista em uma data específica
   */
  static async getAvailableSlots(
    nutritionistId: string,
    date: Date
  ): Promise<TimeSlot[]> {
    try {
      const dateString = date.toISOString().split('T')[0];
      const response = await api.get<TimeSlot[]>(
        `/appointments/available/${nutritionistId}/${dateString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao buscar horários disponíveis';
      throw new Error(message);
    }
  }

  /**
   * Cria uma conversa para uma consulta
   */
  static async createConversationForAppointment(appointmentId: string): Promise<{ conversationId: string }> {
    try {
      const response = await api.post<{ conversationId: string }>(
        `/appointments/${appointmentId}/conversation`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao criar conversa';
      throw new Error(message);
    }
  }
}

