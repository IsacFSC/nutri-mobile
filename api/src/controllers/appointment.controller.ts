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
      
      if (!patient) {
        return res.json([]);
      }
      
      where.patientId = patient.id;
    }
    // Se for nutricionista, mostrar apenas suas consultas
    else if (req.userRole === 'NUTRITIONIST') {
      const nutritionist = await prisma.nutritionist.findFirst({
        where: { userId: req.userId },
      });
      
      if (!nutritionist) {
        return res.json([]);
      }
      
      where.nutritionistId = nutritionist.id;
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
        conversation: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { dateTime: 'desc' },
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error in getAppointments:', error);
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
    const { nutritionistId, dateTime, duration, notes, type } = req.body;

    // Se for paciente, buscar o patientId
    let patientId = req.body.patientId;
    if (req.userRole === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: req.userId },
      });
      if (!patient) {
        return res.status(404).json({ error: 'Paciente não encontrado' });
      }
      patientId = patient.id;
    }

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

    // Criar consulta e conversa em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar a consulta
      const newAppointment = await tx.appointment.create({
        data: {
          patientId,
          nutritionistId,
          dateTime: new Date(dateTime),
          duration: duration || 60,
          type: type || 'ONLINE',
          notes,
        },
      });

      // Criar conversa automaticamente para a consulta
      const conversation = await tx.conversation.create({
        data: {
          patientId,
          nutritionistId,
          appointmentId: newAppointment.id,
          status: 'ACTIVE',
        },
      });

      // Buscar consulta completa com relacionamentos
      const appointment = await tx.appointment.findUnique({
        where: { id: newAppointment.id },
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
          conversation: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      return appointment;
    });

    res.status(201).json(result);
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

// POST /api/appointments/:id/conversation
export const createConversationForAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar a consulta
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        conversation: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    // Se já tem conversa, retornar a existente
    if (appointment.conversation) {
      return res.json({ conversationId: appointment.conversation.id });
    }

    // Criar nova conversa
    const conversation = await prisma.conversation.create({
      data: {
        patientId: appointment.patientId,
        nutritionistId: appointment.nutritionistId,
        appointmentId: appointment.id,
        status: 'ACTIVE',
      },
    });

    res.status(201).json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Erro ao criar conversa' });
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

    // Buscar consultas agendadas para o dia (usando UTC)
    const startOfDay = new Date(Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      0, 0, 0, 0
    ));

    const endOfDay = new Date(Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      23, 59, 59, 999
    ));

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
