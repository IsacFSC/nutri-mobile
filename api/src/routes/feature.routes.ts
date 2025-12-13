import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as featureController from '../controllers/feature.controller';

const router = Router();

router.use(authenticateToken);

// GET /api/features/patient/:patientId - Buscar recursos do paciente
router.get('/patient/:patientId', featureController.getPatientFeatures);

// PUT /api/features/patient/:patientId - Atualizar recursos (Admin/Nutritionist)
router.put(
  '/patient/:patientId',
  authorizeRoles('ADMIN', 'NUTRITIONIST'),
  featureController.updatePatientFeatures
);

// POST /api/features/schedule - Agendar liberação de recurso (Admin/Nutritionist)
router.post(
  '/schedule',
  authorizeRoles('ADMIN', 'NUTRITIONIST'),
  featureController.scheduleFeatureRelease
);

// GET /api/features/scheduled/:patientId - Buscar agendamentos
router.get('/scheduled/:patientId', featureController.getScheduledFeatures);

export default router;
