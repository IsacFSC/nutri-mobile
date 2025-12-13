import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// GET /api/appointments
export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};

    // Se for paciente, mostrar apenas suas consultas
    if (req.userRole === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: req.userId },
      });
      where.patientId = patient?.id;
    }
    // Se for nutricionista, mostrar apenas suas consultas
    else if (req.userRole === 'NUTRITIONIST') {
      const nutritionist = await prisma.nutritionist.findFirst({
        where: { userId: req.userId },
      });
      where.nutritionistId = nutritionist?.id;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        nutritionist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { dateTime: 'desc' },
    });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar consultas' });
  }
};

// GET /api/appointments/:id
export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        nutritionist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar consulta' });
  }
};

// POST /api/appointments
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, nutritionistId, dateTime, duration, notes } = req.body;

    // Verificar se horário está disponível
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        nutritionistId,
        dateTime: new Date(dateTime),
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
    });

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'Horário não disponível' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        nutritionistId,
        dateTime: new Date(dateTime),
        duration: duration || 60,
        notes,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
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
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar consulta' });
  }
};

// PUT /api/appointments/:id
export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, videoRoomUrl } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        notes,
        videoRoomUrl,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
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
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar consulta' });
  }
};

// DELETE /api/appointments/:id
export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cancelar consulta' });
  }
};

// GET /api/appointments/available/:nutritionistId/:date
export const getAvailableSlots = async (req: AuthRequest, res: Response) => {
  try {
    const { nutritionistId, date } = req.params;

    // Buscar disponibilidade do nutricionista
    const nutritionist = await prisma.nutritionist.findUnique({
      where: { id: nutritionistId },
    });

    if (!nutritionist) {
      return res.status(404).json({ error: 'Nutricionista não encontrado' });
    }

    const availability = nutritionist.availability as any;
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const dayAvailability = availability[dayOfWeek];

    if (!dayAvailability || !dayAvailability.isAvailable) {
      return res.json([]);
    }

    // Buscar consultas agendadas para o dia
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        nutritionistId,
        dateTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
    });

    // Filtrar horários disponíveis
    const availableSlots = dayAvailability.slots.filter((slot: any) => {
      const [startHour, startMinute] = slot.start.split(':').map(Number);
      const slotStart = new Date(dateObj);
      slotStart.setHours(startHour, startMinute, 0, 0);

      const hasConflict = appointments.some((apt) => {
        const aptStart = apt.dateTime;
        const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);

        return slotStart >= aptStart && slotStart < aptEnd;
      });

      return !hasConflict;
    });

    res.json(availableSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar horários disponíveis' });
  }
};
