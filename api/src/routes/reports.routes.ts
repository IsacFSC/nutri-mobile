import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { getAppointmentsReport, getSummaryReport } from '../controllers/reports.controller';

const router = Router();

// GET /api/reports/appointments - Relatório de atendimentos
router.get(
  '/appointments',
  authenticateToken,
  authorizeRoles('NUTRITIONIST', 'ADMIN'),
  getAppointmentsReport
);

// GET /api/reports/summary - Resumo geral
router.get(
  '/summary',
  authenticateToken,
  authorizeRoles('NUTRITIONIST', 'ADMIN'),
  getSummaryReport
);

export default router;
