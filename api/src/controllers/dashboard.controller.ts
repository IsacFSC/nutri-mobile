import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// GET /api/dashboard/nutritionist-stats
export const getNutritionistStats = async (req: AuthRequest, res: Response) => {
  try {
    const nutritionist = await prisma.nutritionist.findFirst({
      where: { userId: req.userId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!nutritionist) {
      return res.status(404).json({ error: 'Nutricionista não encontrado' });
    }

    // Contar pacientes ativos (diretos ou com consultas)
    const activePatientsCount = await prisma.patient.count({
      where: {
        OR: [
          { nutritionistId: nutritionist.id },
          { appointments: { some: { nutritionistId: nutritionist.id } } },
        ],
      },
    });

    // Buscar consultas de hoje (usando UTC para consistência)
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayAppointmentsCount = await prisma.appointment.count({
      where: {
        nutritionistId: nutritionist.id,
        dateTime: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
    });

    // Buscar próximas consultas (próximas 5)
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        nutritionistId: nutritionist.id,
        dateTime: {
          gte: new Date(),
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'],
        },
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        dateTime: 'asc',
      },
      take: 5,
    });

    // Contar receitas criadas pelo nutricionista
    const recipesCount = await prisma.recipe.count({
      where: {
        createdBy: nutritionist.id,
      },
    });

    const stats = {
      activePatientsCount,
      todayAppointmentsCount,
      recipesCount,
      upcomingAppointments,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching nutritionist stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// GET /api/dashboard/patient-stats
export const getPatientStats = async (req: AuthRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { userId: req.userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    // Contar consultas agendadas
    const upcomingAppointmentsCount = await prisma.appointment.count({
      where: {
        patientId: patient.id,
        dateTime: {
          gte: new Date(),
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'],
        },
      },
    });

    // Próxima consulta
    const nextAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        dateTime: {
          gte: new Date(),
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'],
        },
      },
      include: {
        nutritionist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        dateTime: 'asc',
      },
    });

    res.json({
      upcomingAppointmentsCount,
      nextAppointment,
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// GET /api/dashboard/admin-stats
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    // Contar organizações
    const organizationsCount = await prisma.organization.count();

    // Contar nutricionistas (total e ativos)
    const totalNutritionists = await prisma.nutritionist.count();
    const activeNutritionists = await prisma.nutritionist.count({
      where: { isActive: true },
    });

    // Contar pacientes
    const patientsCount = await prisma.patient.count();

    // Contar consultas (total e hoje)
    const totalAppointments = await prisma.appointment.count();
    
    // Usar UTC para consistência
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayAppointments = await prisma.appointment.count({
      where: {
        dateTime: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
    });

    // Contar receitas
    const recipesCount = await prisma.recipe.count();

    res.json({
      organizationsCount,
      totalNutritionists,
      activeNutritionists,
      patientsCount,
      totalAppointments,
      todayAppointments,
      recipesCount,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};
