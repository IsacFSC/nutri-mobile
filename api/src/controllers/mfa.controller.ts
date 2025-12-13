import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { AuthRequest } from '../middlewares/auth.middleware';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Gerar QR Code para configurar MFA
 */
export const setupMfa = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, mfaEnabled: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA já está habilitado' });
    }

    // Gerar secret TOTP
    const secret = speakeasy.generateSecret({
      name: `Nutri Mobile (${user.email})`,
      issuer: 'Nutri Mobile'
    });

    // Gerar códigos de backup (8 códigos de 8 dígitos)
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Salvar secret temporariamente (não ativa MFA ainda)
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret.base32,
        mfaBackupCodes: backupCodes,
      }
    });

    // Gerar QR Code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      qrCode: qrCodeUrl,
      secret: secret.base32,
      backupCodes,
      message: 'Escaneie o QR Code com Google Authenticator ou Authy'
    });
  } catch (error: any) {
    console.error('Error setting up MFA:', error);
    res.status(500).json({ error: 'Falha ao configurar MFA', details: error.message });
  }
};

/**
 * Verificar código TOTP e ativar MFA
 */
export const verifyAndEnableMfa = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Código TOTP é obrigatório' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true }
    });

    if (!user || !user.mfaSecret) {
      return res.status(400).json({ error: 'MFA não foi configurado' });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA já está ativo' });
    }

    // Verificar código TOTP
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Permite 2 códigos anteriores/posteriores
    });

    if (!verified) {
      return res.status(400).json({ error: 'Código TOTP inválido' });
    }

    // Ativar MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        lastMfaVerifiedAt: new Date()
      }
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_ENABLED',
        resource: 'User',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    res.json({ 
      success: true,
      message: 'MFA ativado com sucesso! Seu login agora requer autenticação de dois fatores.'
    });
  } catch (error: any) {
    console.error('Error enabling MFA:', error);
    res.status(500).json({ error: 'Falha ao ativar MFA', details: error.message });
  }
};

/**
 * Desativar MFA (requer senha)
 */
export const disableMfa = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { password, token } = req.body;

    if (!password || !token) {
      return res.status(400).json({ error: 'Senha e código TOTP são obrigatórios' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({ error: 'MFA não está ativo' });
    }

    // Verificar senha
    const bcrypt = require('bcryptjs');
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Verificar código TOTP
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Código TOTP inválido' });
    }

    // Desativar MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
        lastMfaVerifiedAt: null
      }
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_DISABLED',
        resource: 'User',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    res.json({ 
      success: true,
      message: 'MFA desativado com sucesso'
    });
  } catch (error: any) {
    console.error('Error disabling MFA:', error);
    res.status(500).json({ error: 'Falha ao desativar MFA', details: error.message });
  }
};

/**
 * Verificar código TOTP durante login
 */
export const verifyMfaToken = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, token, useBackupCode } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: 'UserId e código são obrigatórios' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA não está configurado' });
    }

    let verified = false;

    if (useBackupCode) {
      // Verificar código de backup
      if (user.mfaBackupCodes.includes(token)) {
        verified = true;
        
        // Remover código de backup usado
        const updatedCodes = user.mfaBackupCodes.filter(code => code !== token);
        await prisma.user.update({
          where: { id: userId },
          data: { mfaBackupCodes: updatedCodes }
        });

        // Auditoria
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'MFA_BACKUP_CODE_USED',
            resource: 'User',
            resourceId: userId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { remainingCodes: updatedCodes.length }
          }
        });
      }
    } else {
      // Verificar TOTP
      if (user.mfaSecret) {
        verified = speakeasy.totp.verify({
          secret: user.mfaSecret,
          encoding: 'base32',
          token: token,
          window: 2
        });
      }
    }

    if (!verified) {
      // Incrementar tentativas falhas
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: { increment: 1 }
        }
      });

      return res.status(400).json({ error: 'Código inválido' });
    }

    // Atualizar última verificação MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastMfaVerifiedAt: new Date(),
        failedLoginAttempts: 0
      }
    });

    res.json({ 
      success: true,
      verified: true,
      message: 'MFA verificado com sucesso'
    });
  } catch (error: any) {
    console.error('Error verifying MFA:', error);
    res.status(500).json({ error: 'Falha ao verificar MFA', details: error.message });
  }
};

/**
 * Gerar novos códigos de backup
 */
export const regenerateBackupCodes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA não está ativo' });
    }

    // Verificar senha
    const bcrypt = require('bcryptjs');
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Gerar novos códigos
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: backupCodes }
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_BACKUP_CODES_REGENERATED',
        resource: 'User',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    res.json({ 
      backupCodes,
      message: 'Novos códigos de backup gerados. Guarde-os em local seguro!'
    });
  } catch (error: any) {
    console.error('Error regenerating backup codes:', error);
    res.status(500).json({ error: 'Falha ao gerar códigos', details: error.message });
  }
};
