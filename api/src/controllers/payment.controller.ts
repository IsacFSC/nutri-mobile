import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/payments/subscriptions - Listar assinaturas com status de pagamento
export const listSubscriptions = async (req: Request, res: Response) => {
  try {
    const { status, organizationId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (organizationId) where.organizationId = organizationId as string;

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true,
          },
        },
        payments: {
          orderBy: { dueDate: 'desc' },
          take: 3,
        },
        _count: {
          select: {
            payments: true,
            alerts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular dias em atraso para cada assinatura
    const subscriptionsWithOverdue = subscriptions.map((sub) => {
      const lastPayment = sub.payments[0];
      let daysOverdue = 0;

      if (lastPayment && lastPayment.status === 'OVERDUE') {
        const today = new Date();
        const dueDate = new Date(lastPayment.dueDate);
        daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        ...sub,
        daysOverdue,
        lastPayment,
      };
    });

    res.json(subscriptionsWithOverdue);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Erro ao buscar assinaturas' });
  }
};

// POST /api/payments/subscriptions - Criar assinatura para organização
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { organizationId, plan, monthlyPrice, billingDay, trialDays } = req.body;

    const startDate = new Date();
    const trialEndsAt = trialDays
      ? new Date(startDate.getTime() + trialDays * 24 * 60 * 60 * 1000)
      : null;

    const subscription = await prisma.subscription.create({
      data: {
        organizationId,
        plan: plan || 'BASIC',
        monthlyPrice,
        billingDay: billingDay || 1,
        trialEndsAt,
        status: 'ACTIVE',
      },
      include: {
        organization: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Erro ao criar assinatura' });
  }
};

// PUT /api/payments/subscriptions/:id - Atualizar assinatura
export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, plan, monthlyPrice, billingDay, gracePeriodDays } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (plan) data.plan = plan;
    if (monthlyPrice !== undefined) data.monthlyPrice = monthlyPrice;
    if (billingDay !== undefined) data.billingDay = billingDay;

    if (gracePeriodDays !== undefined) {
      const now = new Date();
      data.gracePeriodEndsAt = new Date(
        now.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000
      );
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data,
      include: {
        organization: true,
      },
    });

    res.json(subscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Erro ao atualizar assinatura' });
  }
};

// POST /api/payments/alerts - Enviar alerta de pagamento
export const sendPaymentAlert = async (req: Request, res: Response) => {
  try {
    const { subscriptionId, message, daysOverdue } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        organization: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Criar alerta no banco
    const alert = await prisma.paymentAlert.create({
      data: {
        subscriptionId,
        message,
        daysOverdue: daysOverdue || 0,
      },
    });

    // TODO: Enviar notificação por email/SMS (integrar com serviço de email)
    // await sendEmail(subscription.organization.email, message);

    // Se ultrapassou período de carência, suspender acesso
    if (subscription.gracePeriodEndsAt && new Date() > subscription.gracePeriodEndsAt) {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'SUSPENDED' },
      });
    }

    res.json({
      alert,
      message: 'Alerta enviado com sucesso',
      organizationEmail: subscription.organization.email,
    });
  } catch (error) {
    console.error('Error sending payment alert:', error);
    res.status(500).json({ error: 'Erro ao enviar alerta' });
  }
};

// GET /api/payments/overdue - Listar pagamentos em atraso
export const listOverduePayments = async (req: Request, res: Response) => {
  try {
    const today = new Date();

    const overduePayments = await prisma.payment.findMany({
      where: {
        status: {
          in: ['PENDING', 'OVERDUE'],
        },
        dueDate: {
          lt: today,
        },
      },
      include: {
        subscription: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Calcular dias em atraso
    const paymentsWithDays = overduePayments.map((payment) => {
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...payment,
        daysOverdue,
      };
    });

    res.json(paymentsWithDays);
  } catch (error) {
    console.error('Error fetching overdue payments:', error);
    res.status(500).json({ error: 'Erro ao buscar pagamentos em atraso' });
  }
};

// POST /api/payments/:id/mark-paid - Marcar pagamento como pago
export const markPaymentAsPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { method, transactionId } = req.body;

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        method: method || null,
        transactionId: transactionId || null,
      },
      include: {
        subscription: {
          include: {
            organization: true,
          },
        },
      },
    });

    // Reativar assinatura se estava suspensa
    if (payment.subscription.status === 'SUSPENDED') {
      await prisma.subscription.update({
        where: { id: payment.subscription.id },
        data: { status: 'ACTIVE', gracePeriodEndsAt: null },
      });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({ error: 'Erro ao marcar pagamento como pago' });
  }
};

// GET /api/payments/stats - Estatísticas de pagamentos
export const getPaymentStats = async (req: Request, res: Response) => {
  try {
    const [totalSubscriptions, activeSubscriptions, suspendedSubscriptions, overdueCount] =
      await Promise.all([
        prisma.subscription.count(),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.subscription.count({ where: { status: 'SUSPENDED' } }),
        prisma.payment.count({
          where: {
            status: 'OVERDUE',
          },
        }),
      ]);

    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });

    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    });

    res.json({
      totalSubscriptions,
      activeSubscriptions,
      suspendedSubscriptions,
      overdueCount,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};
