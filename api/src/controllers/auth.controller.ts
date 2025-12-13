import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, name, role = 'PATIENT' } = req.body;

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    // Criar Patient ou Nutritionist
    if (role === 'PATIENT') {
      await prisma.patient.create({
        data: {
          userId: user.id,
          planType: 'FREE',
        },
      });
    } else if (role === 'NUTRITIONIST' || role === 'ADMIN') {
      await prisma.nutritionist.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Gerar tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Salvar refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        patient: true,
        nutritionist: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar se conta está bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({ 
        error: 'Conta bloqueada',
        message: `Conta bloqueada até ${user.lockedUntil.toLocaleString('pt-BR')} devido a múltiplas tentativas de login`
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Incrementar tentativas falhas
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };

      // Bloquear conta após 5 tentativas falhas
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });

      // Auditoria
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          resource: 'Auth',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          metadata: { failedAttempts, reason: 'Invalid password' }
        }
      });

      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        attemptsRemaining: Math.max(0, 5 - failedAttempts)
      });
    }

    // Se MFA está habilitado, não gerar token completo ainda
    if (user.mfaEnabled) {
      // Gerar token temporário sem permissões completas
      const tempToken = jwt.sign(
        { userId: user.id, mfaRequired: true },
        process.env.JWT_SECRET!,
        { expiresIn: '5m' } // Token temporário válido por 5 minutos
      );

      return res.json({
        requireMfa: true,
        tempToken,
        userId: user.id,
        message: 'MFA requerido. Por favor, forneça o código de autenticação.'
      });
    }

    // Login bem-sucedido - resetar tentativas falhas
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        lastLoginIp: req.ip || null
      }
    });

    // Gerar tokens
    const accessToken = generateAccessToken(user.id, user.role, false);
    const refreshToken = generateRefreshToken(user.id);

    // Salvar refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'Auth',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        mfaEnabled: user.mfaEnabled,
        patient: user.patient,
        nutritionist: user.nutritionist,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Verificar se token existe no banco
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    // Gerar novo access token
    const accessToken = generateAccessToken(storedToken.user.id, storedToken.user.role);

    res.json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao renovar token' });
  }
};

// POST /api/auth/reset-password-request
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Por segurança, não revelar se o email existe
      return res.json({ message: 'Se o email existir, um link de recuperação será enviado' });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Salvar token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    });

    // TODO: Enviar email com link de reset
    // sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'Se o email existir, um link de recuperação será enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao solicitar reset de senha' });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar token
    const resetToken = await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Marcar token como usado
    await prisma.passwordReset.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
};

// Helper functions
function generateAccessToken(userId: string, role: string, mfaVerified: boolean = false): string {
  const secret: string = process.env.JWT_SECRET || 'fallback-secret-key';
  
  return jwt.sign(
    { userId, role, mfaVerified },
    secret,
    { expiresIn: '1h' }
  ) as string;
}

function generateRefreshToken(userId: string): string {
  const secret: string = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key';
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: '7d' }
  ) as string;
}
