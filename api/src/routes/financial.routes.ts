import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import {
  createTransaction,
  listTransactions,
  getBalance,
  getFinancialSummary,
  updateTransaction,
} from '../controllers/financial.controller';

const router = Router();

// POST /api/financial/transactions - Criar nova transação
router.post(
  '/transactions',
  authenticateToken,
  authorizeRoles('NUTRITIONIST', 'ADMIN'),
  createTransaction
);

// GET /api/financial/transactions - Listar transações
router.get(
  '/transactions',
  authenticateToken,
  authorizeRoles('NUTRITIONIST', 'ADMIN'),
  listTransactions
);

// GET /api/financial/balance - Obter saldo do caixa
router.get(
  '/balance',
  authenticateToken,
  authorizeRoles('NUTRITIONIST', 'ADMIN'),
  getBalance
);

// GET /api/financial/summary - Resumo financeiro mensal
router.get(
  '/summary',
  authenticateToken,
  authorizeRoles('NUTRITIONIST', 'ADMIN'),
  getFinancialSummary
);

// PUT /api/financial/transactions/:id - Atualizar transação
router.put(
  '/transactions/:id',
  authenticateToken,
  authorizeRoles('NUTRITIONIST', 'ADMIN'),
  updateTransaction
);

export default router;
