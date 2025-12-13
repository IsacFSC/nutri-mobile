import { Router } from 'express';
import { authenticateToken, auditAction } from '../middlewares/auth.middleware';
import * as mfaController from '../controllers/mfa.controller';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// POST /api/mfa/setup - Configurar MFA (gerar QR Code)
router.post('/setup', mfaController.setupMfa);

// POST /api/mfa/verify-and-enable - Verificar código e ativar MFA
router.post(
  '/verify-and-enable',
  auditAction('MFA_ENABLE_ATTEMPT'),
  mfaController.verifyAndEnableMfa
);

// POST /api/mfa/disable - Desativar MFA
router.post(
  '/disable',
  auditAction('MFA_DISABLE_ATTEMPT'),
  mfaController.disableMfa
);

// POST /api/mfa/verify - Verificar código TOTP durante login
router.post('/verify', mfaController.verifyMfaToken);

// POST /api/mfa/regenerate-backup-codes - Gerar novos códigos de backup
router.post(
  '/regenerate-backup-codes',
  auditAction('MFA_BACKUP_CODES_REGENERATE'),
  mfaController.regenerateBackupCodes
);

export default router;
