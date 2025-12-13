import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

/**
 * Upload de avatar do usuário
 */
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Validar tipo de arquivo
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      // Deletar arquivo inválido
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Formato de arquivo inválido. Use JPG, PNG ou WEBP' });
    }

    // Validar tamanho (5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 5MB' });
    }

    // Buscar avatar antigo para deletar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (user?.avatar) {
      const oldPath = path.join(__dirname, '../../', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Caminho relativo do arquivo
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Atualizar avatar no banco
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true
      }
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AVATAR_UPLOADED',
        resource: 'User',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { 
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      }
    });

    res.json({
      success: true,
      message: 'Avatar atualizado com sucesso',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    
    // Deletar arquivo em caso de erro
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Falha ao fazer upload do avatar', details: error.message });
  }
};

/**
 * Deletar avatar
 */
export const deleteAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (!user?.avatar) {
      return res.status(404).json({ error: 'Avatar não encontrado' });
    }

    // Deletar arquivo físico
    const filePath = path.join(__dirname, '../../', user.avatar);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remover do banco
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null }
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AVATAR_DELETED',
        resource: 'User',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    res.json({
      success: true,
      message: 'Avatar removido com sucesso'
    });
  } catch (error: any) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ error: 'Falha ao deletar avatar', details: error.message });
  }
};

/**
 * Aceitar termos LGPD
 */
export const acceptLgpdTerms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { 
      lgpdConsent, 
      lgpdDataProcessing, 
      lgpdMarketingConsent,
      termsVersion,
      privacyPolicyVersion
    } = req.body;

    if (!lgpdConsent || !lgpdDataProcessing) {
      return res.status(400).json({ 
        error: 'Consentimento obrigatório',
        message: 'Você deve aceitar os termos de uso e o processamento de dados para continuar'
      });
    }

    const now = new Date();

    await prisma.user.update({
      where: { id: userId },
      data: {
        lgpdConsent: true,
        lgpdConsentDate: now,
        lgpdDataProcessing: true,
        lgpdMarketingConsent: lgpdMarketingConsent || false,
        termsAcceptedAt: now,
        privacyPolicyAcceptedAt: now,
      }
    });

    // Auditoria LGPD
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LGPD_CONSENT_ACCEPTED',
        resource: 'User',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: {
          lgpdConsent,
          lgpdDataProcessing,
          lgpdMarketingConsent,
          termsVersion,
          privacyPolicyVersion,
          acceptedAt: now.toISOString()
        }
      }
    });

    res.json({
      success: true,
      message: 'Termos aceitos com sucesso'
    });
  } catch (error: any) {
    console.error('Error accepting LGPD terms:', error);
    res.status(500).json({ error: 'Falha ao aceitar termos', details: error.message });
  }
};

/**
 * Solicitar exportação de dados (LGPD)
 */
export const requestDataExport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Criar requisição de exportação
    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        userId,
        email: user.email,
        status: 'PENDING'
      }
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DATA_EXPORT_REQUESTED',
        resource: 'DataExportRequest',
        resourceId: exportRequest.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    // TODO: Processar exportação em background job
    // Por enquanto, retornar confirmação

    res.json({
      success: true,
      message: 'Solicitação de exportação de dados recebida. Você receberá um email com o link de download em até 48 horas.',
      requestId: exportRequest.id
    });
  } catch (error: any) {
    console.error('Error requesting data export:', error);
    res.status(500).json({ error: 'Falha ao solicitar exportação', details: error.message });
  }
};

/**
 * Solicitar exclusão de dados (LGPD)
 */
export const requestDataDeletion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Criar requisição de exclusão
    const deletionRequest = await prisma.dataDeletionRequest.create({
      data: {
        userId,
        email: user.email,
        reason: reason || null,
        status: 'PENDING'
      }
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DATA_DELETION_REQUESTED',
        resource: 'DataDeletionRequest',
        resourceId: deletionRequest.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { reason }
      }
    });

    res.json({
      success: true,
      message: 'Solicitação de exclusão de dados recebida. Sua conta será analisada e você receberá uma resposta em até 7 dias.',
      requestId: deletionRequest.id
    });
  } catch (error: any) {
    console.error('Error requesting data deletion:', error);
    res.status(500).json({ error: 'Falha ao solicitar exclusão', details: error.message });
  }
};

/**
 * Obter logs de auditoria do usuário (LGPD - transparência)
 */
export const getMyAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          action: true,
          resource: true,
          ipAddress: true,
          createdAt: true,
          metadata: true
        }
      }),
      prisma.auditLog.count({ where: { userId } })
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Falha ao buscar logs', details: error.message });
  }
};
