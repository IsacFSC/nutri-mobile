# 🥗 Nutri Mobile

**Sistema completo de acompanhamento nutricional com segurança MFA e conformidade LGPD**

Aplicação mobile desenvolvida em React Native/Expo que conecta nutricionistas e pacientes através de uma plataforma segura, permitindo gestão de planos alimentares, consultas, e acompanhamento de progresso com controle granular de recursos por paciente.

## 📋 Sobre o Projeto

Nutri Mobile é uma solução moderna para profissionais de nutrição que buscam digitalizar e otimizar o atendimento aos seus pacientes. Com autenticação rigorosa (MFA), conformidade total com a LGPD e recursos personalizáveis por paciente, oferece uma experiência segura e personalizada para ambos os perfis de usuário.

## 👨‍⚕️ Recursos para Nutricionistas

### Gestão de Pacientes
- **Cadastro completo de pacientes** com dados antropométricos, histórico médico e objetivos
- **Controle granular de recursos** - ative/desative funcionalidades individualmente para cada paciente
- **Dashboard com estatísticas** - visualize pacientes ativos, consultas do dia e métricas importantes
- **Gestão de planos personalizados** - crie planos Básico, Premium ou totalmente customizados

### Planos Alimentares
- **Criação de cardápios semanais** com receitas personalizadas
- **Biblioteca de receitas** com informações nutricionais completas
- **Cálculo automático de macros** e calorias por refeição
- **Exportação de planos** em PDF para impressão

### Agendamento e Consultas
- **Definição de disponibilidade** - configure horários de trabalho e pausas
- **Agenda integrada** - visualize todas as consultas agendadas
- **Consultas online** - integração com plataforma de vídeo conferência
- **Notificações automáticas** - lembretes para nutricionista e paciente

### Acompanhamento
- **Histórico completo** de evolução do paciente (peso, medidas, fotos)
- **Gráficos de progresso** - visualize a evolução ao longo do tempo
- **Anotações e observações** - registre informações importantes sobre cada consulta
- **Chat direto** - comunicação assíncrona com pacientes

### Segurança MFA
- **Autenticação de dois fatores** com Google Authenticator
- **8 códigos de backup** para recuperação de acesso
- **Geração de QR Code** para configuração inicial
- **Proteção de dados sensíveis** conforme LGPD

### Conformidade LGPD
- **Logs de auditoria** - rastreie todas as ações no sistema
- **Exportação de dados** - forneça todos os dados do paciente em JSON
- **Exclusão de dados** - remova completamente informações quando solicitado
- **Consentimento explícito** para coleta e uso de dados

---

## 🏥 Recursos para Pacientes

### Plano Alimentar
- **Visualização diária e semanal** do cardápio personalizado
- **Receitas detalhadas** com ingredientes e modo de preparo
- **Informações nutricionais** - calorias, proteínas, carboidratos e gorduras
- **Marcar refeições consumidas** - acompanhe sua adesão ao plano

### Consultas
- **Agendamento online** - veja horários disponíveis e agende com facilidade
- **Consultas por vídeo** - atendimento remoto sem sair de casa
- **Histórico de consultas** - acesse registros de atendimentos anteriores
- **Lembretes automáticos** - notificações 1 hora antes da consulta

### Acompanhamento
- **Registro de progresso** - anote peso, medidas e observações
- **Upload de fotos** - documente sua evolução visual
- **Gráficos de evolução** - visualize seu progresso ao longo do tempo
- **Anotações pessoais** - registre como se sente e dificuldades

### Comunicação
- **Chat com nutricionista** - tire dúvidas de forma assíncrona
- **Envio de fotos** - compartilhe fotos de refeições
- **Notificações** - receba atualizações importantes

### Recursos Personalizáveis
Acesso a recursos adicionais conforme liberação do seu nutricionista:
- ✅ Consultas Online
- ✅ Plano Alimentar Diário
- ✅ Biblioteca de Exercícios
- ✅ Chat Direto
---

## 🛠️ Tecnologias e Arquitetura

### Stack Principal

#### **Frontend Mobile**
- **React Native 0.76.6** - Framework para desenvolvimento cross-platform
- **Expo SDK 54** - Plataforma de desenvolvimento e build
- **TypeScript 5.3** - Tipagem estática para maior segurança
- **Expo Router 6.0** - Navegação baseada em file-system

#### **Backend API**
- **Node.js 22.x** - Runtime JavaScript server-side
- **Express 4.21** - Framework web minimalista e robusto
- **TypeScript 5.7** - Tipagem no backend para consistência

#### **Banco de Dados**
- **PostgreSQL 15+** - Banco relacional robusto e escalável
- **Neon Database** - PostgreSQL serverless para cloud
- **Prisma ORM 5.22** - ORM type-safe com migrações automáticas

#### **Gerenciamento de Estado**
- **Zustand 5.0** - State management leve e performático
- **AsyncStorage** - Persistência local de dados

### Segurança e Autenticação

#### **Sistema MFA (Multi-Factor Authentication)**
- **Speakeasy 2.0** - Geração e validação de TOTP (Time-based One-Time Password)
- **QRCode 1.5** - Geração de QR Codes para Google Authenticator
- **JWT (JSON Web Tokens)** - Tokens de acesso (1h) e refresh (7d)
- **bcrypt 5.1** - Hash seguro de senhas com salt

---

## 🔐 Segurança em Detalhes

### Sistema MFA Completo

**Tecnologias:**
- `speakeasy` - Gerador TOTP compatível com RFC 6238
- `qrcode` - Geração de QR Codes para apps autenticadores
- Google Authenticator, Authy, Microsoft Authenticator compatíveis

**Funcionalidades:**
1. **Setup Inicial** - Geração de secret key única por usuário
2. **QR Code** - Escaneável por apps autenticadores padrão
---

## 📁 Estrutura do Projeto

```
nutri-mobile/
├── app/                          # Rotas do aplicativo (Expo Router)
│   ├── (tabs)/                  # Navegação por abas
│   │   ├── _layout.tsx          # Layout das tabs
│   │   ├── index.tsx            # Dashboard inicial
│   │   ├── meal-plan.tsx        # Plano alimentar do paciente
│   │   ├── appointments.tsx     # Consultas e agendamentos
│   │   ├── patients.tsx         # Lista de pacientes (Nutricionista)
│   │   ├── recipes.tsx          # Biblioteca de receitas
│   │   ├── schedule.tsx         # Agenda do nutricionista
│   │   └── profile.tsx          # Perfil e configurações
│   ├── _layout.tsx              # Layout global com proteção de rotas
│   ├── index.tsx                # Redirecionamento inicial
│   ├── login.tsx                # Tela de login
│   ├── register.tsx             # Cadastro de usuário
│   ├── reset-password.tsx       # Recuperação de senha
│   └── new-patient.tsx          # Cadastro de novo paciente
│
├── api/                         # Backend Node.js + Express
│   ├── prisma/
│   │   ├── schema.prisma        # Schema do banco de dados
│   │   ├── migrations/          # Migrations versionadas
│   │   └── seed-patient.ts      # Dados de teste
│   ├── src/
│   │   ├── controllers/         # Lógica de negócio
│   │   │   ├── auth.controller.ts
│   │   │   ├── mfa.controller.ts
│   │   │   ├── patient.controller.ts
│   │   │   ├── appointment.controller.ts
│   │   │   ├── mealPlan.controller.ts
│   │   │   ├── recipe.controller.ts
│   │   │   ├── upload.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── middlewares/         # Middlewares de autenticação
│   │   │   ├── auth.middleware.ts
│   │   │   └── upload.middleware.ts
│   │   ├── routes/              # Rotas da API
│   │   │   ├── auth.routes.ts
│   │   │   ├── mfa.routes.ts
│   │   │   ├── lgpd.routes.ts
│   │   │   ├── patient.routes.ts
│   │   │   └── ...
│   │   ├── @types/              # Type declarations
│   │   │   └── speakeasy.d.ts
│   │   └── index.ts             # Entry point da API
│   ├── uploads/                 # Arquivos enviados (avatares, fotos)
│   ├── package.json
│   └── tsconfig.json
│
├── src/                         # Source do app mobile
│   ├── components/
│   │   ├── common/              # Componentes reutilizáveis
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── admin/               # Componentes do nutricionista
│   │       ├── FeatureControlPanel.tsx
│   │       ├── PatientCard.tsx
│   │       └── PatientList.tsx
│   ├── services/                # Camada de API
│   │   ├── auth.service.ts
3. **Configure o banco de dados**

Crie uma conta no [Neon](https://neon.tech) e obtenha a connection string PostgreSQL.

4. **Configure as variáveis de ambiente**

**API (`api/.env`):**
```env
DATABASE_URL="postgresql://usuario:senha@host:5432/nutrimobile"
JWT_SECRET="seu-secret-super-seguro-aqui"
JWT_REFRESH_SECRET="outro-secret-ainda-mais-seguro"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

5. **Execute as migrações do banco**
```bash
cd api
npx prisma generate
npx prisma migrate deploy
npm run seed  # Cria usuários de teste
```emplate de variáveis de ambiente
6. **Inicie a API**
```bash
cd api
npm run dev
# API rodando em http://localhost:3000
```

7. **Inicie o app mobile** (em outro terminal)
```bash
cd ..
npm start
# ou npx expo start
```

8. **Execute no dispositivo**
```bash
# Android
npm run android

# iOS (apenas macOS)
npm run ios

# Web (testes)
npm run web
```

### Usuários de Teste

Após rodar o seed script, você terá:

**Paciente:**
- Email: `paciente@teste.com`
- Senha: `123456`

**Nutricionista:**
- Email: `nutricionista@teste.com`
- Senha: `123456`i/recipes/*        # Receitas e cardápios
---

## 📊 API Endpoints

### Autenticação e Segurança
```
POST   /api/auth/register           # Criar conta
POST   /api/auth/login              # Login
POST   /api/auth/refresh            # Renovar token
POST   /api/auth/reset-password     # Recuperar senha

POST   /api/mfa/setup               # Configurar MFA
POST   /api/mfa/validate            # Validar código TOTP
GET    /api/mfa/backup-codes        # Gerar códigos de backup
POST   /api/mfa/disable             # Desativar MFA
```

### LGPD
```
GET    /api/lgpd/audit-logs         # Logs de auditoria
GET    /api/lgpd/export-data        # Exportar dados
POST   /api/lgpd/delete-account     # Excluir conta
GET    /api/lgpd/data-usage         # Relatório de uso
```

### Gestão de Pacientes
```
GET    /api/patients                # Listar pacientes
POST   /api/patients                # Criar paciente
GET    /api/patients/:id            # Detalhes do paciente
PUT    /api/patients/:id            # Atualizar paciente
DELETE /api/patients/:id            # Excluir paciente
```

### Consultas
```
GET    /api/appointments            # Listar consultas
POST   /api/appointments            # Agendar consulta
PUT    /api/appointments/:id        # Atualizar consulta
DELETE /api/appointments/:id        # Cancelar consulta
```

### Planos Alimentares
```
GET    /api/meal-plans              # Listar planos
POST   /api/meal-plans              # Criar plano
GET    /api/meal-plans/:id          # Detalhes do plano
PUT    /api/meal-plans/:id          # Atualizar plano
DELETE /api/meal-plans/:id          # Excluir plano
```

### Upload
```
POST   /api/upload/avatar           # Upload de avatar
POST   /api/upload/progress-photo   # Upload de foto de progresso
```

Documentação completa: `API_STATUS.md` Firestore (Database)
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
---

## 🚀 Deploy

### App Mobile
```bash
# Build de desenvolvimento
eas build --profile development --platform android

# Build APK para testes
eas build --profile preview --platform android

# Build de produção
eas build --profile production --platform all
```

### API Backend
Veja guia completo em `DEPLOYMENT.md`

**Opções de deploy:**
- VPS (AWS, DigitalOcean, Linode)
- Heroku
- Railway
---

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: Adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

**Padrões de Commit:**
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

**Isac FSC**
- GitHub: [@IsacFSC](https://github.com/IsacFSC)
- Repository: [nutri-mobile](https://github.com/IsacFSC/nutri-mobile)

---

## 📚 Documentação Adicional

- [AUTENTICACAO.md](AUTENTICACAO.md) - Sistema de autenticação detalhado
- [SECURITY_MFA_LGPD.md](SECURITY_MFA_LGPD.md) - Segurança e conformidade
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guia de deploy completo
- [API_STATUS.md](API_STATUS.md) - Status dos endpoints
- [ASSETS_NEEDED.md](ASSETS_NEEDED.md) - Como criar assets do app

---

## 🔖 Versão

**v1.0.0** - Dezembro 2025
- ✅ Sistema completo de autenticação
- ✅ MFA com Google Authenticator
- ✅ Conformidade LGPD total
- ✅ 11 endpoints de segurança
- ✅ Painéis completos (Nutricionista/Paciente)
- ✅ Pronto para produção

---

<div align="center">

**Desenvolvido com ❤️ e ☕ para revolucionar o atendimento nutricional**

[⬆ Voltar ao topo](#-nutri-mobile)

</div>
- [x] Gestão de consultas
- [x] Planos alimentares
- [x] Upload de imagens
- [x] Controle de recursos por paciente

### Fase 2 - Em Desenvolvimento 🚧
- [ ] Notificações push
- [ ] Integração com vídeo conferência
- [ ] Gráficos de progresso
- [ ] Exportação de relatórios PDF
- [ ] Chat em tempo real

### Fase 3 - Futuro 📅
- [ ] Sistema de pagamentos (Stripe/PagSeguro)
- [ ] Modo offline com sincronização
- [ ] Múltiplos idiomas (i18n)
- [ ] Dark mode
- [ ] Integração com wearables (Apple Health/Google Fit)
- [ ] IA para sugestões de cardápios
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
