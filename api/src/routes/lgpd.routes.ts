import { Router } from 'express';
import { authenticateToken, auditAction } from '../middlewares/auth.middleware';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// POST /api/lgpd/accept-terms - Aceitar termos LGPD
router.post(
  '/accept-terms',
  auditAction('LGPD_TERMS_ACCEPTED'),
  uploadController.acceptLgpdTerms
);

// POST /api/lgpd/export-data - Solicitar exportação de dados
router.post(
  '/export-data',
  auditAction('LGPD_DATA_EXPORT'),
  uploadController.requestDataExport
);

// POST /api/lgpd/delete-data - Solicitar exclusão de dados
router.post(
  '/delete-data',
  auditAction('LGPD_DATA_DELETION'),
  uploadController.requestDataDeletion
);

// GET /api/lgpd/my-audit-logs - Ver meus logs de auditoria
router.get(
  '/my-audit-logs',
  uploadController.getMyAuditLogs
);

export default router;
