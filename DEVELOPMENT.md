# Guia de Desenvolvimento - Nutri Mobile

## 🎯 Visão Geral Técnica

Este guia contém informações detalhadas para desenvolvedores que desejam contribuir ou entender a arquitetura do projeto.

## 🏗️ Arquitetura

### Padrões Utilizados

- **Atomic Design**: Componentes organizados em níveis (atoms, molecules, organisms)
- **Service Layer**: Lógica de negócios isolada em services
- **State Management**: Zustand para gerenciamento global de estado
- **Type Safety**: TypeScript strict mode para segurança de tipos

### Fluxo de Dados

```
UI Components → Stores (Zustand) → Services → Firebase → Firestore
                    ↓
                 Local State
```

## 📦 Módulos Principais

### 1. Autenticação (Auth)

**Responsável por**: Login, registro, logout, recuperação de senha

**Arquivos**:
- `src/services/auth.service.ts`
- `src/store/authStore.ts`
- `app/login.tsx`
- `app/register.tsx`

**Fluxo**:
1. Usuário insere credenciais
2. `authStore.login()` chama `AuthService.login()`
3. Firebase autentica
4. Dados do usuário salvos no Firestore
5. Store atualizado com dados do usuário

### 2. Controle de Recursos (Features)

**Responsável por**: Gerenciar recursos habilitados por paciente

**Arquivos**:
- `src/services/feature.service.ts`
- `src/store/patientStore.ts`
- `src/components/admin/FeatureControlPanel.tsx`

**Métodos Principais**:

```typescript
// Atualizar recursos de um paciente
FeatureService.updatePatientFeatures(patientId, features)

// Ativar/Desativar um recurso específico
FeatureService.toggleFeature(patientId, featureKey, isEnabled)

// Agendar liberação de recurso
FeatureService.scheduleFeatureRelease({
  patientId,
  featureKey,
  releaseDate,
  note
})

// Verificar acesso a recurso
FeatureService.hasFeatureAccess(patientId, featureKey)
```

### 3. Agendamentos (Appointments)

**Responsável por**: Gerenciar consultas e disponibilidade

**Arquivos**:
- `src/services/appointment.service.ts`
- `app/(tabs)/appointments.tsx`

**Métodos Principais**:

```typescript
// Definir disponibilidade do nutricionista
AppointmentService.saveAvailability(nutritionistId, availability)

// Criar consulta
AppointmentService.createAppointment({
  patientId,
  nutritionistId,
  dateTime,
  duration,
  status
})

// Buscar horários disponíveis
AppointmentService.getAvailableSlots(nutritionistId, date)

// Cancelar consulta
AppointmentService.cancelAppointment(appointmentId)
```

### 4. Planos Alimentares (Meal Plans)

**Responsável por**: Receitas, alimentos e planos alimentares

**Arquivos**:
- `src/services/mealPlan.service.ts`
- `app/(tabs)/meal-plan.tsx`

**Métodos Principais**:

```typescript
// Criar receita
MealPlanService.createRecipe(recipe)

// Criar plano diário
MealPlanService.createDailyMealPlan(plan)

// Marcar refeição como consumida
MealPlanService.markMealAsConsumed(planId, mealId, isConsumed)

// Buscar plano do dia
MealPlanService.getDailyMealPlan(patientId, date)
```

## 🎨 Componentes

### Estrutura de Componentes

```
components/
├── common/              # Componentes reutilizáveis
│   ├── Button.tsx      # Botão customizado
│   ├── Input.tsx       # Campo de entrada
│   ├── Card.tsx        # Container de card
│   └── Loading.tsx     # Indicador de carregamento
├── admin/              # Componentes do administrador
│   ├── FeatureControlPanel.tsx
│   └── PatientCard.tsx
└── patient/            # Componentes do paciente
    ├── MealCard.tsx
    └── AppointmentCard.tsx
```

### Criando Novos Componentes

#### Exemplo: Componente Básico

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/src/constants';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
});
```

## 🔧 Services

### Criando um Novo Service

```typescript
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export class MyService {
  /**
   * Descrição do método
   */
  static async myMethod(param: string): Promise<ReturnType> {
    try {
      // Lógica do método
      const result = await someFirebaseOperation();
      return result;
    } catch (error: any) {
      throw new Error(`Erro ao executar: ${error.message}`);
    }
  }
}
```

### Boas Práticas para Services

1. **Métodos estáticos**: Use para operações que não mantêm estado
2. **Try-Catch**: Sempre capture erros e forneça mensagens descritivas
3. **Tipagem**: Use TypeScript para todos os parâmetros e retornos
4. **Documentação**: Adicione JSDoc para todos os métodos públicos
5. **Validação**: Valide dados antes de enviar ao Firebase

## 📊 Gerenciamento de Estado

### Zustand Store

#### Estrutura Básica

```typescript
import { create } from 'zustand';

interface MyState {
  data: any[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  setData: (data: any[]) => void;
  clearError: () => void;
}

export const useMyStore = create<MyState>((set, get) => ({
  data: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await MyService.getData();
      set({ data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  setData: (data) => set({ data }),
  
  clearError: () => set({ error: null }),
}));
```

#### Usando o Store

```typescript
import { useMyStore } from '@/src/store/myStore';

function MyComponent() {
  const { data, isLoading, fetchData } = useMyStore();

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return <Loading />;

  return <View>...</View>;
}
```

## 🔥 Firebase

### Estrutura de Segurança (Firestore Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Appointments - paciente pode ler/criar suas próprias
    match /appointments/{appointmentId} {
      allow read: if request.auth != null && 
        (resource.data.patientId == request.auth.uid || 
         resource.data.nutritionistId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.nutritionistId;
    }
    
    // Meal plans - apenas nutricionista pode criar/editar
    match /dailyMealPlans/{planId} {
      allow read: if request.auth.uid == resource.data.patientId;
      allow write: if request.auth.token.role in ['ADMIN', 'NUTRITIONIST'];
    }
    
    // Recipes - apenas admin pode criar/editar
    match /recipes/{recipeId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role in ['ADMIN', 'NUTRITIONIST'];
    }
  }
}
```

### Cloud Functions (Futuro)

```typescript
// Processar liberações agendadas
export const processScheduledReleases = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    const scheduled = await admin.firestore()
      .collection('scheduledFeatures')
      .where('isReleased', '==', false)
      .where('releaseDate', '<=', now)
      .get();
    
    for (const doc of scheduled.docs) {
      const data = doc.data();
      
      // Ativar recurso
      await admin.firestore()
        .collection('users')
        .doc(data.patientId)
        .update({
          [`enabledFeatures.${data.featureKey}`]: true
        });
      
      // Marcar como liberado
      await doc.ref.update({ isReleased: true });
      
      // Enviar notificação
      await sendFeatureUnlockedNotification(data.patientId, data.featureKey);
    }
  });
```

## 🔔 Notificações

### Configuração

```typescript
import * as Notifications from 'expo-notifications';

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Solicitar permissão
async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('Permissão de notificação negada!');
    return;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

// Agendar notificação local
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Lembrete de Consulta',
    body: 'Sua consulta começa em 1 hora',
    data: { appointmentId: '123' },
  },
  trigger: {
    seconds: 60 * 60, // 1 hora
  },
});
```

## 🧪 Testes

### Testes Unitários (Jest)

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/src/components/common/Button';

describe('Button Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <Button title="Click me" onPress={() => {}} />
    );
    expect(getByText('Click me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click me" onPress={onPress} />
    );
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalled();
  });

  it('should show loading indicator when loading', () => {
    const { queryByText, getByTestId } = render(
      <Button title="Click me" onPress={() => {}} loading />
    );
    
    expect(queryByText('Click me')).toBeNull();
  });
});
```

### Testes de Services

```typescript
import { AuthService } from '@/src/services/auth.service';

jest.mock('./firebase', () => ({
  auth: {},
  db: {},
}));

describe('AuthService', () => {
  it('should login successfully', async () => {
    const user = await AuthService.login('test@test.com', 'password');
    expect(user).toBeDefined();
    expect(user.email).toBe('test@test.com');
  });

  it('should throw error on invalid credentials', async () => {
    await expect(
      AuthService.login('invalid@test.com', 'wrong')
    ).rejects.toThrow();
  });
});
```

## 🎨 Estilização

### Design System

Utilize sempre as constantes definidas em `src/constants/index.ts`:

```typescript
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
});
```

### Temas e Cores

```typescript
// Cores principais
Colors.primary
Colors.secondary
Colors.accent

// Cores de texto
Colors.text.primary
Colors.text.secondary
Colors.text.disabled

// Cores de status
Colors.error
Colors.warning
Colors.success
Colors.info
```

## 🔄 Navegação

### Expo Router - File-based Routing

```
app/
├── index.tsx                 # /
├── login.tsx                # /login
├── register.tsx             # /register
├── (tabs)/                  # Grupo de abas
│   ├── _layout.tsx         # Layout das abas
│   ├── index.tsx           # /tabs
│   ├── meal-plan.tsx       # /tabs/meal-plan
│   └── profile.tsx         # /tabs/profile
└── patient/
    └── [id].tsx            # /patient/:id (rota dinâmica)
```

### Navegação Programática

```typescript
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();

  const navigate = () => {
    router.push('/meal-plan');          // Navegar
    router.replace('/(tabs)');          // Substituir
    router.back();                      // Voltar
    router.push(`/patient/${id}`);      // Rota dinâmica
  };
}
```

## 📱 Performance

### Otimizações

1. **Lazy Loading de Imagens**
```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={1000}
/>
```

2. **Memoização de Componentes**
```typescript
const MemoizedComponent = React.memo(MyComponent);
```

3. **useMemo e useCallback**
```typescript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

4. **FlatList com Otimizações**
```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
/>
```

## 🐛 Debugging

### React Native Debugger

```bash
# Instalar
brew install react-native-debugger

# Abrir
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### Logs

```typescript
// Desenvolvimento
console.log('Debug:', data);
console.warn('Aviso:', message);
console.error('Erro:', error);

// Produção - usar serviço de logging
// Sentry, LogRocket, etc.
```

## 📚 Recursos Adicionais

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Happy Coding! 🚀**
