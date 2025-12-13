# Nutri Mobile

Sistema de acompanhamento nutricional com controle granular de recursos para nutricionistas e pacientes.

## 📋 Descrição

Nutri Mobile é uma aplicação móvel desenvolvida em React Native/Expo que permite aos nutricionistas gerenciar seus pacientes e controlar individualmente quais recursos cada paciente tem acesso. Os pacientes podem acompanhar seus planos alimentares, agendar consultas e monitorar seu progresso.

## 🎯 Principais Funcionalidades

### Módulo Administrador (Nutricionista)

#### RF Admin 1.0 - Controle de Acesso a Recursos
- Gerenciamento de lista mestra de recursos disponíveis
- Recursos incluem: Consultas Online, Plano Alimentar, Biblioteca de Exercícios, Chat Direto, etc.

#### RF Admin 1.1 - Ativação por Paciente
- Visualização de todos os pacientes
- Toggles individuais para ativar/desativar recursos por paciente
- Controle granular de acesso

#### RF Admin 1.2 - Agendamento de Liberação
- Agendar liberação automática de recursos
- Exemplo: "Liberar Plano Alimentar Fase 2 após consulta de retorno"

#### RF Admin 1.3 - Gestão de Planos
- Criação de planos (Básico, Premium, Custom)
- Conjuntos predefinidos de recursos por plano
- Aplicação de planos a pacientes

### Módulo de Agendamento

#### RF 2.0 - Definição de Disponibilidade
- Nutricionista define horários de trabalho
- Bloqueio de horários de almoço/pausas
- Configuração por dia da semana

#### RF 2.1 - Agendamento pelo Paciente
- Visualização de horários disponíveis
- Agendamento de consultas (se recurso liberado)
- Confirmação automática

#### RF 2.2 - Confirmação e Lembretes
- Notificações push 1 hora antes da consulta
- Lembretes por email (opcional)
- Confirmação para ambas as partes

#### RF 2.3 - Sala de Vídeo Conferência
- Integração com plataforma de vídeo
- Consultas online dentro do app
- Gravação de consultas (opcional)

### Módulo de Conteúdo

#### RF 3.0 - Cadastro de Alimentos/Receitas
- Cadastro de alimentos com informações nutricionais
- Criação de receitas com ingredientes
- Categorização (Café da Manhã, Almoço, etc.)

#### RF 3.1 - Criação de Plano Alimentar
- Montagem de planos semanais
- Drag and drop de receitas
- Visualização por dia/semana

#### RF 3.2 - Visualização do Plano
- Paciente visualiza plano diário e semanal
- Marcar refeições como consumidas
- Anotações pessoais

#### RF 3.3 - Biblioteca de Exercícios
- Upload de vídeos de exercícios
- Instruções detalhadas
- Categorização por tipo

#### RF 3.4 - Chat/Mensagens
- Canal de comunicação assíncrona
- Envio de fotos e arquivos
- Notificações de novas mensagens

## 🛡️ Requisitos Não Funcionais

### RNF 1.0 - Segurança de Dados
- Criptografia end-to-end
- Dados de saúde protegidos (LGPD/HIPAA)
- Autenticação segura (Firebase Auth)

### RNF 1.1 - Performance
- Carregamento rápido mesmo em conexões lentas
- Cache de dados offline
- Otimização de imagens

### RNF 1.2 - Compatibilidade
- iOS e Android
- Responsivo para tablets
- Suporte a diferentes tamanhos de tela

### RNF 1.3 - Autenticação Segura
- Firebase Authentication
- Recuperação de senha
- Verificação de email

## 🚀 Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **Firebase** - Backend as a Service
  - Authentication
  - Firestore (Database)
  - Storage
  - Cloud Functions (futuro)
- **Zustand** - Gerenciamento de estado
- **React Hook Form** - Gerenciamento de formulários
- **Expo Router** - Navegação baseada em arquivos

## 📁 Estrutura do Projeto

```
nutri-mobile/
├── app/                        # Rotas do aplicativo (Expo Router)
│   ├── (tabs)/                # Navegação por abas
│   │   ├── _layout.tsx
│   │   ├── index.tsx          # Tela inicial
│   │   ├── meal-plan.tsx      # Plano alimentar
│   │   ├── appointments.tsx   # Consultas
│   │   ├── patients.tsx       # Gerenciar pacientes (Admin)
│   │   └── profile.tsx        # Perfil do usuário
│   ├── index.tsx              # Ponto de entrada
│   ├── login.tsx              # Tela de login
│   └── register.tsx           # Tela de registro
├── src/
│   ├── components/            # Componentes reutilizáveis
│   │   ├── common/           # Componentes genéricos
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Loading.tsx
│   │   ├── admin/            # Componentes do admin
│   │   │   ├── FeatureControlPanel.tsx
│   │   │   └── PatientCard.tsx
│   │   └── patient/          # Componentes do paciente
│   ├── services/             # Serviços e APIs
│   │   ├── firebase.ts
│   │   ├── auth.service.ts
│   │   ├── feature.service.ts
│   │   ├── appointment.service.ts
│   │   └── mealPlan.service.ts
│   ├── store/                # Gerenciamento de estado
│   │   ├── authStore.ts
│   │   └── patientStore.ts
│   ├── types/                # Definições de tipos TypeScript
│   │   └── index.ts
│   ├── constants/            # Constantes e configurações
│   │   └── index.ts
│   └── utils/                # Funções utilitárias
├── assets/                   # Imagens, fontes, etc.
├── .env.example             # Exemplo de variáveis de ambiente
├── app.json                 # Configuração do Expo
├── package.json
└── tsconfig.json
```

## 🔧 Instalação

### Pré-requisitos

- Node.js (v16 ou superior)
- npm ou yarn
- Expo CLI
- Conta no Firebase

### Passo a Passo

1. **Clone o repositório**
```bash
cd nutri-mobile
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Firebase:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

4. **Configure o Firebase**

Acesse [Firebase Console](https://console.firebase.google.com/):
- Crie um novo projeto
- Ative Authentication (Email/Password)
- Crie um banco Firestore
- Ative Storage
- Copie as credenciais para o `.env`

5. **Inicie o projeto**
```bash
npm start
```

6. **Execute no emulador ou dispositivo**
```bash
# iOS
npm run ios

# Android
npm run android

# Web (para testes)
npm run web
```

## 📱 Uso

### Como Nutricionista

1. **Criar conta** como nutricionista
2. **Adicionar pacientes** ao sistema
3. **Configurar recursos** individuais para cada paciente
4. **Criar planos alimentares** personalizados
5. **Agendar consultas** e definir disponibilidade
6. **Acompanhar progresso** dos pacientes

### Como Paciente

1. **Criar conta** ou receber convite do nutricionista
2. **Visualizar recursos** liberados pelo nutricionista
3. **Acessar plano alimentar** se liberado
4. **Agendar consultas** nos horários disponíveis
5. **Registrar progresso** (peso, medidas, fotos)
6. **Comunicar com nutricionista** via chat

## 🔐 Recursos Disponíveis

- ✅ **ONLINE_CONSULTATIONS** - Consultas Online
- ✅ **DAILY_MEAL_PLAN** - Plano Alimentar Diário
- ✅ **EXERCISE_LIBRARY** - Biblioteca de Exercícios
- ✅ **DIRECT_CHAT** - Chat Direto
- ✅ **PROGRESS_TRACKING** - Acompanhamento de Progresso
- ✅ **RECIPES** - Receitas
- ✅ **SHOPPING_LIST** - Lista de Compras
- ✅ **WATER_REMINDER** - Lembrete de Água
- ✅ **MEAL_PHOTOS** - Fotos das Refeições

## 🗂️ Tipos de Planos

### Gratuito (FREE)
- Acompanhamento básico de progresso
- Lembrete de água

### Básico (BASIC)
- Plano alimentar diário
- Receitas
- Acompanhamento de progresso

### Premium (PREMIUM)
- Todos os recursos do Básico
- Consultas online
- Chat direto
- Biblioteca de exercícios
- Todos os recursos disponíveis

### Personalizado (CUSTOM)
- Recursos selecionados individualmente
- Liberação agendada de recursos
- Controle total do nutricionista

## 🔄 Fluxo de Dados

### Autenticação
```
Firebase Auth → authStore → Componentes
```

### Gerenciamento de Recursos
```
Nutricionista → FeatureService → Firestore → Patient App
```

### Agendamentos
```
Paciente → AppointmentService → Firestore → Notificações
```

## 📊 Estrutura do Firestore

```
users/
  {userId}/
    - email
    - name
    - role (ADMIN | NUTRITIONIST | PATIENT)
    - enabledFeatures (para pacientes)
    - planType

appointments/
  {appointmentId}/
    - patientId
    - nutritionistId
    - dateTime
    - status
    - videoRoomUrl

dailyMealPlans/
  {planId}/
    - patientId
    - date
    - meals[]
    - totalNutrition

scheduledFeatures/
  {scheduleId}/
    - patientId
    - featureKey
    - releaseDate
    - isReleased

recipes/
  {recipeId}/
    - name
    - ingredients[]
    - nutrition
    - category
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage
```

## 📝 Próximos Passos

- [ ] Implementar telas restantes (meal-plan, appointments, patients, profile)
- [ ] Adicionar testes unitários e de integração
- [ ] Implementar notificações push
- [ ] Integração com plataforma de vídeo (Daily.co/Agora)
- [ ] Sistema de pagamento para planos
- [ ] Dashboard com gráficos de progresso
- [ ] Exportação de relatórios (PDF)
- [ ] Modo offline com sincronização
- [ ] Suporte a múltiplos idiomas
- [ ] Dark mode

## 👥 Contribuição

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📧 Contato

Para dúvidas ou sugestões, entre em contato através do email: contato@nutrimobile.com

---

**Desenvolvido com ❤️ para nutricionistas e pacientes**
