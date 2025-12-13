import api from '@/src/config/api';
import {
  Patient,
  EnabledFeatures,
  FeatureKey,
} from '@/src/types';

export class FeatureService {
  /**
   * RF Admin 1.1 - Atualiza recursos habilitados para um paciente específico
   */
  static async updatePatientFeatures(
    patientId: string,
    features: Partial<EnabledFeatures>
  ): Promise<void> {
    try {
      await api.put(`/features/${patientId}`, { enabledFeatures: features });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao atualizar recursos';
      throw new Error(message);
    }
  }

  /**
   * RF Admin 1.1 - Ativa/Desativa um recurso específico para um paciente
   */
  static async toggleFeature(
    patientId: string,
    featureKey: FeatureKey,
    isEnabled: boolean
  ): Promise<void> {
    try {
      await api.patch(`/features/${patientId}/toggle`, {
        featureKey,
        isEnabled,
      });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao alternar recurso';
      throw new Error(message);
    }
  }

  /**
   * Verifica se um paciente tem acesso a um recurso
   */
  static async hasFeatureAccess(
    patientId: string,
    featureKey: FeatureKey
  ): Promise<boolean> {
    try {
      const response = await api.get<{ hasAccess: boolean }>(
        `/features/${patientId}/check/${featureKey}`
      );
      return response.data.hasAccess;
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Busca todos os recursos habilitados de um paciente
   */
  static async getPatientFeatures(patientId: string): Promise<EnabledFeatures | null> {
    try {
      const response = await api.get<Patient>(`/patients/${patientId}`);
      return response.data.enabledFeatures || null;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao buscar recursos';
      throw new Error(message);
    }
  }
}

