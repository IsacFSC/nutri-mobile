import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import patientRoutes from './routes/patient.routes';
import featureRoutes from './routes/feature.routes';
import appointmentRoutes from './routes/appointment.routes';
import recipeRoutes from './routes/recipe.routes';
import mealPlanRoutes from './routes/mealPlan.routes';
import mfaRoutes from './routes/mfa.routes';
import uploadRoutes from './routes/upload.routes';
import lgpdRoutes from './routes/lgpd.routes';
import organizationRoutes from './routes/organization.routes';
import nutritionistRoutes from './routes/nutritionist.routes';
import paymentRoutes from './routes/payment.routes';
import conversationRoutes from './routes/conversation.routes';
import dashboardRoutes from './routes/dashboard.routes';
import videoCallRoutes from './routes/videoCall.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/lgpd', lgpdRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/nutritionists', nutritionistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/video-calls', videoCallRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Criar servidor HTTP
const httpServer = createServer(app);

// Configurar Socket.IO para WebRTC signaling
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  },
});

// WebRTC Signaling Server
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Entrar em uma sala (conversationId)
  socket.on('join-room', (roomId: string, userId: string) => {
    console.log(`👤 User ${userId} joining room ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId, socket.id);
  });

  // Sinalização WebRTC - Offer
  socket.on('offer', (roomId: string, offer: RTCSessionDescriptionInit) => {
    console.log('📤 Sending offer to room:', roomId);
    socket.to(roomId).emit('offer', offer, socket.id);
  });

  // Sinalização WebRTC - Answer
  socket.on('answer', (roomId: string, answer: RTCSessionDescriptionInit) => {
    console.log('📥 Sending answer to room:', roomId);
    socket.to(roomId).emit('answer', answer, socket.id);
  });

  // Sinalização WebRTC - ICE Candidate
  socket.on('ice-candidate', (roomId: string, candidate: RTCIceCandidateInit) => {
    console.log('🧊 Sending ICE candidate to room:', roomId);
    socket.to(roomId).emit('ice-candidate', candidate, socket.id);
  });

  // Sair da sala
  socket.on('leave-room', (roomId: string) => {
    console.log('👋 User leaving room:', roomId);
    socket.to(roomId).emit('user-disconnected', socket.id);
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
  console.log(`🔌 WebRTC Signaling: Socket.IO ready`);
});
