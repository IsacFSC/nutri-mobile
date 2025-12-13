import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// GET /api/conversations - Listar conversas do usuário
export const listConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    let where: any = {};

    if (userRole === 'NUTRITIONIST') {
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
      });
      if (!nutritionist) {
        return res.status(404).json({ error: 'Nutricionista não encontrado' });
      }
      where.nutritionistId = nutritionist.id;
    } else if (userRole === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId },
      });
      if (!patient) {
        return res.status(404).json({ error: 'Paciente não encontrado' });
      }
      where.patientId = patient.id;
    } else {
      return res.status(403).json({ error: 'Apenas nutricionistas e pacientes podem acessar conversas' });
    }

    const conversations = await prisma.conversation.findMany({
      where,
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
        appointment: {
          select: {
            id: true,
            dateTime: true,
            duration: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calcular mensagens não lidas
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId! },
            isRead: false,
          },
        });

        return {
          ...conv,
          unreadCount,
          lastMessage: conv.messages[0] || null,
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
};

// GET /api/conversations/:id - Obter detalhes da conversa
export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const conversation = await prisma.conversation.findUnique({
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
        appointment: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Marcar mensagens como lidas
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: userId! },
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Erro ao buscar conversa' });
  }
};

// POST /api/conversations - Criar nova conversa
export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, nutritionistId, appointmentId } = req.body;

    // Verificar se já existe conversa para esta consulta
    if (appointmentId) {
      const existing = await prisma.conversation.findUnique({
        where: { appointmentId },
      });

      if (existing) {
        return res.status(400).json({ error: 'Já existe uma conversa para esta consulta' });
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        patientId,
        nutritionistId,
        appointmentId: appointmentId || null,
        status: appointmentId ? 'SCHEDULED' : 'ACTIVE',
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
        appointment: true,
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Erro ao criar conversa' });
  }
};

// POST /api/conversations/:id/messages - Enviar mensagem
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id: conversationId } = req.params;
    const { content, type, fileName, fileSize } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    // Verificar se a conversa existe e se o usuário tem acesso
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        patient: { select: { userId: true } },
        nutritionist: { select: { userId: true } },
        appointment: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Verificar permissão
    const hasAccess =
      conversation.patient.userId === userId ||
      conversation.nutritionist.userId === userId;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Você não tem acesso a esta conversa' });
    }

    // Verificar se a consulta já pode ser iniciada (se houver appointmentId)
    if (conversation.appointment && conversation.status === 'SCHEDULED') {
      const appointmentTime = new Date(conversation.appointment.dateTime);
      const now = new Date();
      const diffMinutes = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);

      // Permitir iniciar até 15 minutos antes
      if (diffMinutes > 15) {
        return res.status(403).json({
          error: 'A conversa ainda não pode ser iniciada',
          message: `A consulta está agendada para ${appointmentTime.toLocaleString('pt-BR')}`,
          canStartAt: new Date(appointmentTime.getTime() - 15 * 60 * 1000),
        });
      }

      // Ativar conversa
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'ACTIVE',
          startedAt: now,
        },
      });

      // Atualizar status da consulta
      await prisma.appointment.update({
        where: { id: conversation.appointment.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Criar mensagem
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId!,
        senderRole: userRole as any,
        content,
        type: type || 'TEXT',
        fileName,
        fileSize,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Atualizar timestamp da conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};

// PUT /api/conversations/:id/end - Finalizar conversa
export const endConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        nutritionist: { select: { userId: true } },
        appointment: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Apenas o nutricionista pode finalizar
    if (conversation.nutritionist.userId !== userId) {
      return res.status(403).json({ error: 'Apenas o nutricionista pode finalizar a conversa' });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });

    // Atualizar status da consulta
    if (conversation.appointment) {
      await prisma.appointment.update({
        where: { id: conversation.appointment.id },
        data: { status: 'COMPLETED' },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error ending conversation:', error);
    res.status(500).json({ error: 'Erro ao finalizar conversa' });
  }
};

// GET /api/conversations/:id/can-start - Verificar se pode iniciar conversa
export const canStartConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        appointment: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    if (!conversation.appointment) {
      return res.json({ canStart: true, reason: 'Conversa sem agendamento' });
    }

    const appointmentTime = new Date(conversation.appointment.dateTime);
    const now = new Date();
    const diffMinutes = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);

    // Permitir iniciar até 15 minutos antes
    const canStart = diffMinutes <= 15;

    res.json({
      canStart,
      appointmentTime,
      currentTime: now,
      minutesUntil: Math.round(diffMinutes),
      message: canStart
        ? 'Você pode iniciar a conversa'
        : `A consulta está agendada para ${appointmentTime.toLocaleString('pt-BR')}`,
    });
  } catch (error) {
    console.error('Error checking conversation start:', error);
    res.status(500).json({ error: 'Erro ao verificar conversa' });
  }
};
