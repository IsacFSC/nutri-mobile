import api from '../config/api';

export interface PatientFormData {
  userId: string;
  nutritionistId: string;
  // Dados Pessoais
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  // Endereço
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Dados Antropométricos
  weight?: number;
  height?: number;
  bodyFat?: number;
  muscleMass?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  // Dados Clínicos
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  medications?: string;
  foodRestrictions?: string;
  familyHistory?: string;
  // Estilo de Vida
  physicalActivity?: string;
  smokingStatus?: string;
  alcoholConsumption?: string;
  sleepHours?: number;
  stressLevel?: string;
  // Objetivos
  goals?: string;
  observations?: string;
}

export interface ConsultationNoteData {
  // Avaliação
  currentWeight?: number;
  currentHeight?: number;
  bloodPressure?: string;
  heartRate?: number;
  bodyComposition?: string;
  // Anamnese
  complaints?: string;
  symptoms?: string;
  dietaryRecall?: string;
  physicalActivity?: string;
  // Diagnóstico
  nutritionalDiagnosis?: string;
  // Tratamento
  nutritionalPlan?: string;
  recommendations?: string;
  goals?: string;
  restrictions?: string;
  // Prescrições
  dietPrescription?: string;
  supplementation?: string;
  // Acompanhamento
  nextAppointment?: string;
  followUpNotes?: string;
  attachments?: string;
}

class PatientService {
  /**
   * Criar novo paciente
   */
  async createPatient(data: PatientFormData) {
    const response = await api.post('/patients', data);
    return response.data;
  }

  /**
   * Listar pacientes do nutricionista
   */
  async getPatients(nutritionistId: string, search?: string, page?: number, limit?: number) {
    const response = await api.get(`/patients/nutritionist/${nutritionistId}`, {
      params: { search, page, limit },
    });
    return response.data;
  }

  /**
   * Buscar paciente por ID
   */
  async getPatientById(id: string) {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  }

  /**
   * Atualizar paciente
   */
  async updatePatient(id: string, data: Partial<PatientFormData>) {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  }

  /**
   * Deletar paciente
   */
  async deletePatient(id: string) {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  }

  /**
   * Buscar histórico de consultas
   */
  async getConsultationHistory(patientId: string) {
    const response = await api.get(`/patients/${patientId}/consultations`);
    return response.data;
  }

  /**
   * Criar nota de consulta
   */
  async createConsultationNote(patientId: string, data: ConsultationNoteData) {
    const response = await api.post(`/patients/${patientId}/consultations`, data);
    return response.data;
  }

  /**
   * Gerar PDF do paciente
   */
  async generatePDF(patientId: string) {
    const response = await api.get(`/patients/${patientId}/pdf`);
    return response.data;
  }
}

export default new PatientService();
