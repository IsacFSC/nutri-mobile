// Tipos de Usuário
export enum UserRole {
  ADMIN = 'ADMIN',
  NUTRITIONIST = 'NUTRITIONIST',
  PATIENT = 'PATIENT',
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations (optional)
  patient?: Patient;
  nutritionist?: Nutritionist;
}

export interface Patient extends User {
  role: UserRole.PATIENT;
  nutritionistId: string;
  enabledFeatures: EnabledFeatures;
  planType: PlanType;
  phone?: string;
  birthDate?: Date;
  weight?: number;
  height?: number;
  goals?: string;
}

export interface Nutritionist extends User {
  role: UserRole.NUTRITIONIST | UserRole.ADMIN;
  specialization?: string;
  crn?: string; // Registro profissional
  availability: Availability;
}

// Feature Control Types
export interface Feature {
  id: string;
  name: string;
  key: FeatureKey;
  description: string;
  icon: string;
  isActive: boolean;
}

export enum FeatureKey {
  ONLINE_CONSULTATIONS = 'ONLINE_CONSULTATIONS',
  DAILY_MEAL_PLAN = 'DAILY_MEAL_PLAN',
  EXERCISE_LIBRARY = 'EXERCISE_LIBRARY',
  DIRECT_CHAT = 'DIRECT_CHAT',
  PROGRESS_TRACKING = 'PROGRESS_TRACKING',
  RECIPES = 'RECIPES',
  SHOPPING_LIST = 'SHOPPING_LIST',
  WATER_REMINDER = 'WATER_REMINDER',
  MEAL_PHOTOS = 'MEAL_PHOTOS',
}

export interface EnabledFeatures {
  [FeatureKey.ONLINE_CONSULTATIONS]: boolean;
  [FeatureKey.DAILY_MEAL_PLAN]: boolean;
  [FeatureKey.EXERCISE_LIBRARY]: boolean;
  [FeatureKey.DIRECT_CHAT]: boolean;
  [FeatureKey.PROGRESS_TRACKING]: boolean;
  [FeatureKey.RECIPES]: boolean;
  [FeatureKey.SHOPPING_LIST]: boolean;
  [FeatureKey.WATER_REMINDER]: boolean;
  [FeatureKey.MEAL_PHOTOS]: boolean;
}

// Plan Types
export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  CUSTOM = 'CUSTOM',
}

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  enabledFeatures: Partial<EnabledFeatures>;
  price: number;
  duration: number; // em dias
}

// Scheduled Feature Release
export interface ScheduledFeature {
  id: string;
  patientId: string;
  featureKey: FeatureKey;
  releaseDate: Date;
  isReleased: boolean;
  note?: string;
}

// Availability Types
export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

export interface DayAvailability {
  isAvailable: boolean;
  slots: TimeSlot[];
  breakTime?: TimeSlot;
}

export interface Availability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

// Appointment Types
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface Appointment {
  id: string;
  patientId: string;
  nutritionistId: string;
  dateTime: string;
  duration: number; // em minutos
  status: AppointmentStatus;
  type: 'ONLINE' | 'PRESENCIAL' | 'RETORNO';
  notes?: string;
  videoRoomUrl?: string;
  reminderSent: boolean;
  createdAt: string;
  patient: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  };
  nutritionist: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  };
  conversation?: {
    id: string;
    status: string;
  };
}

// Meal Plan Types
export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sodium?: number;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  nutrition: NutritionalInfo;
  servingSize: string;
  imageUrl?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: {
    foodId: string;
    quantity: number;
    unit: string;
  }[];
  instructions: string[];
  nutrition: NutritionalInfo;
  prepTime: number; // em minutos
  category: MealCategory;
  imageUrl?: string;
  createdBy: string;
}

export enum MealCategory {
  BREAKFAST = 'BREAKFAST',
  MORNING_SNACK = 'MORNING_SNACK',
  LUNCH = 'LUNCH',
  AFTERNOON_SNACK = 'AFTERNOON_SNACK',
  DINNER = 'DINNER',
  EVENING_SNACK = 'EVENING_SNACK',
}

export interface MealPlanItem {
  id: string;
  recipeId: string;
  category: MealCategory;
  time: string; // HH:mm format
  isConsumed: boolean;
  consumedAt?: Date;
  notes?: string;
}

export interface DailyMealPlan {
  id: string;
  patientId: string;
  date: Date;
  meals: MealPlanItem[];
  totalNutrition: NutritionalInfo;
  notes?: string;
}

export interface WeeklyMealPlan {
  id: string;
  patientId: string;
  weekStart: Date;
  weekEnd: Date;
  dailyPlans: DailyMealPlan[];
  createdBy: string;
}

// Exercise Types
export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  duration: number; // em minutos
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  videoUrl?: string;
  thumbnailUrl?: string;
  instructions: string[];
  caloriesBurned?: number;
  createdBy: string;
}

export enum ExerciseCategory {
  CARDIO = 'CARDIO',
  STRENGTH = 'STRENGTH',
  FLEXIBILITY = 'FLEXIBILITY',
  BALANCE = 'BALANCE',
  YOGA = 'YOGA',
  PILATES = 'PILATES',
}

// Chat Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  fileUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  patientId: string;
  nutritionistId: string;
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Progress Tracking
export interface ProgressEntry {
  id: string;
  patientId: string;
  date: Date;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  hip?: number;
  chest?: number;
  photos?: string[];
  notes?: string;
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export enum NotificationType {
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  NEW_MESSAGE = 'NEW_MESSAGE',
  MEAL_REMINDER = 'MEAL_REMINDER',
  WATER_REMINDER = 'WATER_REMINDER',
  FEATURE_UNLOCKED = 'FEATURE_UNLOCKED',
  PLAN_UPDATE = 'PLAN_UPDATE',
}
