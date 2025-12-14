import api from '@/src/config/api';

export interface NutritionistStats {
  activePatientsCount: number;
  todayAppointmentsCount: number;
  recipesCount: number;
  upcomingAppointments: Array<{
    id: string;
    dateTime: string;
    type: string;
    status: string;
    patient: {
      user: {
        id: string;
        name: string;
        avatar: string | null;
      };
    };
  }>;
}

export interface PatientStats {
  upcomingAppointmentsCount: number;
  nextAppointment: {
    id: string;
    dateTime: string;
    type: string;
    status: string;
    nutritionist: {
      user: {
        id: string;
        name: string;
        avatar: string | null;
      };
    };
  } | null;
}

export interface AdminStats {
  organizationsCount: number;
  totalNutritionists: number;
  activeNutritionists: number;
  patientsCount: number;
  totalAppointments: number;
  todayAppointments: number;
  recipesCount: number;
}

class DashboardService {
  async getNutritionistStats(): Promise<NutritionistStats> {
    const response = await api.get('/dashboard/nutritionist-stats');
    return response.data;
  }

  async getPatientStats(): Promise<PatientStats> {
    const response = await api.get('/dashboard/patient-stats');
    return response.data;
  }

  async getAdminStats(): Promise<AdminStats> {
    const response = await api.get('/dashboard/admin-stats');
    return response.data;
  }
}

export default new DashboardService();
