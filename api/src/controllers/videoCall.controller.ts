import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const videoCallController = {
  // Iniciar videochamada
  async startVideoCall(req: AuthRequest, res: Response) {
    try {
      const { conversationId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Verificar se a conversa existe
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          nutritionist: { include: { user: true } },
          patient: { include: { user: true } },
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      // Verificar permissão
      const hasAccess =
        conversation.nutritionist.userId === userId ||
        conversation.patient.userId === userId;

      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para iniciar chamada nesta conversa' });
      }

      // Verificar se já existe uma chamada ativa
      const activeCall = await prisma.videoCall.findFirst({
        where: {
          conversationId,
          status: { in: ['WAITING', 'ACTIVE'] },
        },
      });

      if (activeCall) {
        return res.json({ videoCall: activeCall });
      }

      // Criar nome único para a sala Jitsi
      const roomName = `nutri-${conversationId}-${Date.now()}`;

      // Criar nova videochamada
      const videoCall = await prisma.videoCall.create({
        data: {
          conversationId,
          roomName,
          initiatedBy: userId,
          status: 'ACTIVE', // ACTIVE desde o início, pois o criador já está entrando
          startedAt: new Date(), // Marcar como iniciada
        },
      });

      // Criar mensagem de histórico de chamada
      const senderRole = conversation.nutritionist.userId === userId ? 'NUTRITIONIST' : 'PATIENT';
      await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          senderRole: senderRole as any, // Cast necessário para enum UserRole
          type: 'VIDEO_CALL', // Agora está no enum MessageType
          content: JSON.stringify({
            videoCallId: videoCall.id,
            status: 'INITIATED',
            initiatedBy: userId,
          }),
        },
      });

      console.log(`[VideoCall] Chamada iniciada: ${videoCall.id} na sala ${roomName}`);

      res.json({ videoCall });
    } catch (error) {
      console.error('[VideoCall] Erro ao iniciar chamada:', error);
      res.status(500).json({ error: 'Erro ao iniciar videochamada' });
    }
  },

  // Entrar na videochamada (atualiza status)
  async joinVideoCall(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const videoCall = await prisma.videoCall.findUnique({
        where: { id },
        include: {
          conversation: {
            include: {
              nutritionist: { include: { user: true } },
              patient: { include: { user: true } },
            },
          },
        },
      });

      if (!videoCall) {
        return res.status(404).json({ error: 'Chamada não encontrada' });
      }

      // Verificar permissão
      const hasAccess =
        videoCall.conversation.nutritionist.userId === userId ||
        videoCall.conversation.patient.userId === userId;

      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para entrar nesta chamada' });
      }

      // Atualizar status para ACTIVE se estava WAITING
      if (videoCall.status === 'WAITING') {
        await prisma.videoCall.update({
          where: { id },
          data: { 
            status: 'ACTIVE',
            startedAt: new Date(), // Marca que a chamada foi atendida
          },
        });
      }

      res.json({ videoCall });
    } catch (error) {
      console.error('[VideoCall] Erro ao entrar na chamada:', error);
      res.status(500).json({ error: 'Erro ao entrar na videochamada' });
    }
  },

  // Encerrar videochamada
  async endVideoCall(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const videoCall = await prisma.videoCall.findUnique({
        where: { id },
        include: {
          conversation: {
            include: {
              nutritionist: { include: { user: true } },
              patient: { include: { user: true } },
            },
          },
        },
      });

      if (!videoCall) {
        return res.status(404).json({ error: 'Chamada não encontrada' });
      }

      // Verificar permissão
      const hasAccess =
        videoCall.conversation.nutritionist.userId === userId ||
        videoCall.conversation.patient.userId === userId;

      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para encerrar esta chamada' });
      }

      // Calcular duração em minutos
      const endedAt = new Date();
      const duration = videoCall.startedAt
        ? Math.ceil((endedAt.getTime() - videoCall.startedAt.getTime()) / 1000 / 60)
        : 0;

      // Verificar se a chamada foi atendida (status foi ACTIVE em algum momento)
      const wasAnswered = videoCall.status === 'ACTIVE' || videoCall.startedAt !== null;

      // Atualizar status
      const updatedCall = await prisma.videoCall.update({
        where: { id },
        data: {
          status: 'ENDED',
          endedAt,
          duration,
        },
      });

      // Atualizar mensagem de histórico
      const callMessage = await prisma.message.findFirst({
        where: {
          conversationId: videoCall.conversationId,
          type: 'VIDEO_CALL',
          content: { contains: videoCall.id },
        },
      });

      if (callMessage) {
        const content = JSON.parse(callMessage.content);
        content.status = wasAnswered ? 'ANSWERED' : 'MISSED';
        content.duration = duration;
        content.endedAt = endedAt.toISOString();

        await prisma.message.update({
          where: { id: callMessage.id },
          data: { content: JSON.stringify(content) },
        });
      }

      console.log(`[VideoCall] Chamada encerrada: ${id}, duração: ${duration} minutos, atendida: ${wasAnswered}`);

      res.json({ videoCall: updatedCall });
    } catch (error) {
      console.error('[VideoCall] Erro ao encerrar chamada:', error);
      res.status(500).json({ error: 'Erro ao encerrar videochamada' });
    }
  },

  // Buscar videochamada ativa de uma conversa
  async getActiveVideoCall(req: AuthRequest, res: Response) {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Verificar permissão na conversa
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          nutritionist: true,
          patient: true,
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      const hasAccess =
        conversation.nutritionist.userId === userId ||
        conversation.patient.userId === userId;

      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para acessar esta conversa' });
      }

      // Buscar chamada ativa
      const videoCall = await prisma.videoCall.findFirst({
        where: {
          conversationId,
          status: { in: ['WAITING', 'ACTIVE'] },
        },
      });

      if (!videoCall) {
        return res.json({ videoCall: null });
      }

      res.json({ videoCall });
    } catch (error) {
      console.error('[VideoCall] Erro ao buscar chamada ativa:', error);
      res.status(500).json({ error: 'Erro ao buscar videochamada' });
    }
  },

  // Histórico de chamadas de uma conversa
  async getVideoCallHistory(req: AuthRequest, res: Response) {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Verificar permissão
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          nutritionist: true,
          patient: true,
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      const hasAccess =
        conversation.nutritionist.userId === userId ||
        conversation.patient.userId === userId;

      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão' });
      }

      const videoCalls = await prisma.videoCall.findMany({
        where: { conversationId },
        orderBy: { startedAt: 'desc' },
      });

      res.json({ videoCalls });
    } catch (error) {
      console.error('[VideoCall] Erro ao buscar histórico:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico de chamadas' });
    }
  },
};
