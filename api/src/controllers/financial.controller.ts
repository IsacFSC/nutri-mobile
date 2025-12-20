import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../utils/db';

// POST /api/financial/transactions - Criar nova transação
export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = (req as any).userRole;
    const {
      patientId,
      appointmentId,
      category,
      amount,
      paymentMethod,
      proofNumber,
      proofImage,
      description,
      notes,
    } = req.body;

    // Validações
    if (!patientId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Paciente, valor e método de pagamento são obrigatórios' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    // Buscar nutricionista
    let nutritionistId: string;

    if (userRole === 'NUTRITIONIST') {
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
      });

      if (!nutritionist) {
        return res.status(404).json({ error: 'Nutricionista não encontrado' });
      }

      nutritionistId = nutritionist.id;
    } else if (userRole === 'ADMIN') {
      // Admin pode criar transação para qualquer nutricionista
      // Buscar nutricionista do paciente
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { nutritionist: true },
      });

      if (!patient || !patient.nutritionistId) {
        return res.status(404).json({ error: 'Paciente sem nutricionista associado' });
      }

      nutritionistId = patient.nutritionistId;
    } else {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    // Calcular taxas (10% para admin)
    const adminFeePercent = 10.0;
    const adminFeeAmount = (amount * adminFeePercent) / 100;
    const netAmount = amount - adminFeeAmount;

    // Criar transação
    const transaction = await prisma.financialTransaction.create({
      data: {
        patientId,
        nutritionistId,
        appointmentId: appointmentId || null,
        type: 'INCOME',
        category: category || 'CONSULTATION',
        amount,
        paymentMethod,
        proofNumber: proofNumber || null,
        proofImage: proofImage || null,
        adminFeePercent,
        adminFeeAmount,
        netAmount,
        description: description || null,
        notes: notes || null,
        status: 'CONFIRMED',
        processedAt: new Date(),
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        nutritionist: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'Pagamento registrado com sucesso',
      transaction,
    });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro ao registrar pagamento' });
  }
};

// GET /api/financial/transactions - Listar transações
export const listTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = (req as any).userRole;
    const { startDate, endDate, status, type } = req.query;

    const where: any = {};

    // Filtro por nutricionista (se não for admin)
    if (userRole === 'NUTRITIONIST') {
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
      });

      if (!nutritionist) {
        return res.status(404).json({ error: 'Nutricionista não encontrado' });
      }

      where.nutritionistId = nutritionist.id;
    }

    // Filtros de data
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Filtro de status
    if (status) {
      where.status = status;
    }

    // Filtro de tipo
    if (type) {
      where.type = type;
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        nutritionist: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(transactions);
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
};

// GET /api/financial/balance - Obter saldo do caixa
export const getBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = (req as any).userRole;
    const { startDate, endDate } = req.query;

    const where: any = {
      status: 'CONFIRMED',
    };

    // Filtro por nutricionista
    if (userRole === 'NUTRITIONIST') {
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
      });

      if (!nutritionist) {
        return res.status(404).json({ error: 'Nutricionista não encontrado' });
      }

      where.nutritionistId = nutritionist.id;
    }

    // Filtros de data
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Buscar transações
    const transactions = await prisma.financialTransaction.findMany({
      where,
    });

    // Calcular totais
    let totalIncome = 0;
    let totalExpense = 0;
    let totalAdminFee = 0;
    let netIncome = 0;

    transactions.forEach(t => {
      if (t.type === 'INCOME') {
        totalIncome += t.amount;
        netIncome += t.netAmount;
        totalAdminFee += t.adminFeeAmount;
      } else if (t.type === 'EXPENSE') {
        totalExpense += t.amount;
      }
    });

    const balance = netIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      totalAdminFee,
      netIncome,
      balance,
      transactionsCount: transactions.length,
    });
  } catch (error) {
    console.error('Erro ao calcular saldo:', error);
    res.status(500).json({ error: 'Erro ao calcular saldo' });
  }
};

// GET /api/financial/summary - Resumo financeiro mensal
export const getFinancialSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = (req as any).userRole;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const where: any = {
      status: 'CONFIRMED',
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };

    if (userRole === 'NUTRITIONIST') {
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
      });

      if (!nutritionist) {
        return res.status(404).json({ error: 'Nutricionista não encontrado' });
      }

      where.nutritionistId = nutritionist.id;
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
    });

    // Agrupar por método de pagamento
    const byPaymentMethod: Record<string, number> = {};
    let totalMonth = 0;
    let netMonth = 0;

    transactions.forEach(t => {
      if (t.type === 'INCOME') {
        totalMonth += t.amount;
        netMonth += t.netAmount;
        byPaymentMethod[t.paymentMethod] = (byPaymentMethod[t.paymentMethod] || 0) + t.amount;
      }
    });

    res.json({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      totalMonth,
      netMonth,
      transactionsCount: transactions.length,
      byPaymentMethod,
    });
  } catch (error) {
    console.error('Erro ao gerar resumo financeiro:', error);
    res.status(500).json({ error: 'Erro ao gerar resumo financeiro' });
  }
};

// PUT /api/financial/transactions/:id - Atualizar transação
export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const transaction = await prisma.financialTransaction.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes || undefined,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.json({
      message: 'Transação atualizada com sucesso',
      transaction,
    });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
};
