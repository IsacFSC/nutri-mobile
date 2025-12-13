import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as patientController from '../controllers/patient.controller';

const router = Router();

router.use(authenticateToken);

// POST /api/patients - Criar paciente (apenas Admin/Nutritionist)
router.post(
  '/',
  authorizeRoles('ADMIN', 'NUTRITIONIST'),
  patientController.createPatient
);

// GET /api/patients/nutritionist/:nutritionistId - Listar pacientes do nutricionista
router.get(
  '/nutritionist/:nutritionistId',
  authorizeRoles('ADMIN', 'NUTRITIONIST'),
  patientController.getPatients
);

// GET /api/patients/:id - Buscar paciente por ID
router.get('/:id', patientController.getPatientById);

// PUT /api/patients/:id - Atualizar paciente
router.put('/:id', patientController.updatePatient);

// DELETE /api/patients/:id - Deletar paciente
router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'NUTRITIONIST'),
  patientController.deletePatient
);

// GET /api/patients/:id/consultations - Histórico de consultas
router.get('/:id/consultations', patientController.getPatientConsultationHistory);

// POST /api/patients/:patientId/consultations - Criar nota de consulta
router.post(
  '/:patientId/consultations',
  authorizeRoles('ADMIN', 'NUTRITIONIST'),
  patientController.createConsultationNote
);

// GET /api/patients/:id/pdf - Gerar PDF do paciente
router.get('/:id/pdf', patientController.generatePatientPDF);

export default router;
