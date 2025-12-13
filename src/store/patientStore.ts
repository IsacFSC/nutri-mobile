import { create } from 'zustand';
import { Patient, EnabledFeatures, FeatureKey } from '@/src/types';
import { FeatureService } from '@/src/services/feature.service';

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPatients: (patients: Patient[]) => void;
  selectPatient: (patient: Patient | null) => void;
  updatePatientFeatures: (patientId: string, features: Partial<EnabledFeatures>) => Promise<void>;
  toggleFeature: (patientId: string, featureKey: FeatureKey, isEnabled: boolean) => Promise<void>;
  clearError: () => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  selectedPatient: null,
  isLoading: false,
  error: null,

  setPatients: (patients: Patient[]) => {
    set({ patients });
  },

  selectPatient: (patient: Patient | null) => {
    set({ selectedPatient: patient });
  },

  updatePatientFeatures: async (patientId: string, features: Partial<EnabledFeatures>) => {
    set({ isLoading: true, error: null });
    try {
      await FeatureService.updatePatientFeatures(patientId, features);
      
      // Atualiza localmente
      const { patients, selectedPatient } = get();
      const updatedPatients = patients.map(p => 
        p.id === patientId 
          ? { ...p, enabledFeatures: { ...p.enabledFeatures, ...features } }
          : p
      );
      
      set({ 
        patients: updatedPatients,
        selectedPatient: selectedPatient?.id === patientId
          ? { ...selectedPatient, enabledFeatures: { ...selectedPatient.enabledFeatures, ...features } }
          : selectedPatient,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  toggleFeature: async (patientId: string, featureKey: FeatureKey, isEnabled: boolean) => {
    set({ isLoading: true, error: null });
    try {
      await FeatureService.toggleFeature(patientId, featureKey, isEnabled);
      
      // Atualiza localmente
      const { patients, selectedPatient } = get();
      const updatedPatients = patients.map(p => 
        p.id === patientId 
          ? { 
              ...p, 
              enabledFeatures: { ...p.enabledFeatures, [featureKey]: isEnabled }
            }
          : p
      );
      
      set({ 
        patients: updatedPatients,
        selectedPatient: selectedPatient?.id === patientId
          ? { 
              ...selectedPatient, 
              enabledFeatures: { ...selectedPatient.enabledFeatures, [featureKey]: isEnabled }
            }
          : selectedPatient,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
