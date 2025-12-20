import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../utils/db';

// GET /api/reports/appointments
export const getAppointmentsReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = (req as any).userRole;
    const { period, date } = req.query;

    if (!period || !date) {
      return res.status(400).json({ error: 'Período e data são obrigatórios' });
    }

    const selectedDate = new Date(date as string);
    let startDate: Date;
    let endDate: Date;

    // Calcular range de datas baseado no período
    if (period === 'day') {
      startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'year') {
      startDate = new Date(selectedDate.getFullYear(), 0, 1);
      endDate = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      return res.status(400).json({ error: 'Período inválido' });
    }

    // Construir filtros baseado no papel do usuário
    const where: any = {
      dateTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Se for nutricionista, filtrar apenas seus atendimentos
    if (userRole === 'NUTRITIONIST') {
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
      });

      if (!nutritionist) {
        return res.status(404).json({ error: 'Nutricionista não encontrado' });
      }

      where.nutritionistId = nutritionist.id;
    }
    // Admin vê todos os atendimentos (não adiciona filtro adicional)

    // Buscar consultas
    const appointments = await prisma.appointment.findMany({
      where,
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
        dateTime: 'desc',
      },
    });

    // Calcular estatísticas
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
    const pending = appointments.filter(a => a.status === 'SCHEDULED').length;

    // Formatar dados dos pacientes
    const patients = appointments.map(appointment => ({
      patientName: appointment.patient.user.name,
      appointmentDate: appointment.dateTime.toISOString(),
      status: appointment.status,
    }));

    res.json({
      total,
      completed,
      cancelled,
      pending,
      patients,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de atendimentos' });
  }
};

// GET /api/reports/summary - Resumo geral para dashboard
export const getSummaryReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = (req as any).userRole;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const where: any = {
      dateTime: {
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

    const [totalMonth, completedMonth, todayAppointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.appointment.count({
        where: {
          ...where,
          dateTime: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lte: new Date(now.setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    res.json({
      totalMonth,
      completedMonth,
      todayAppointments,
      period: 'month',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({ error: 'Erro ao gerar resumo' });
  }
};
