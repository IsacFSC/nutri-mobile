import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
});
