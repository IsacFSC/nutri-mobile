# 📊 Status dos Endpoints da API

**Data:** 10 de Dezembro de 2025  
**Status Geral:** 🟢 Operacional

---

## 🔐 Autenticação (`/api/auth`)

| Método | Endpoint | Controller | Service (App) | Status |
|--------|----------|------------|---------------|--------|
| POST | `/auth/register` | ✅ | ✅ | 🟢 Integrado |
| POST | `/auth/login` | ✅ | ✅ | 🟢 Integrado |
| POST | `/auth/refresh` | ✅ | ✅ | 🟢 Integrado |
| POST | `/auth/reset-password-request` | ✅ | ⚠️ | 🟡 Backend OK |
| POST | `/auth/reset-password` | ✅ | ⚠️ | 🟡 Backend OK |

**Observações:**
- Login e registro totalmente funcionais
- Reset de senha implementado no backend, falta integração no app
- JWT com refresh token funcionando

---

## 👤 Usuários (`/api/users`)

| Método | Endpoint | Controller | Service (App) | Status |
|--------|----------|------------|---------------|--------|
| GET | `/users/me` | ✅ | ✅ | 🟢 Integrado |
| PUT | `/users/me` | ✅ | ✅ | 🟢 Integrado |
| GET | `/users/:id` | ✅ | ❌ | 🟡 Backend OK |

**Observações:**
- Perfil do usuário atual funcionando
- Atualização de perfil com avatar OK
- GET por ID disponível mas não usado no app ainda

---

## 👨‍⚕️ Pacientes (`/api/patients`)

| Método | Endpoint | Controller | Service (App) | Status |
|--------|----------|------------|---------------|--------|
| POST | `/patients` | ✅ | ✅ | 🟢 Integrado |
| GET | `/patients/nutritionist/:nutritionistId` | ✅ | ✅ | 🟢 Integrado |
| GET | `/patients/:id` | ✅ | ✅ | 🟢 Integrado |
| PUT | `/patients/:id` | ✅ | ✅ | 🟢 Integrado |
| DELETE | `/patients/:id` | ✅ | ✅ | 🟢 Integrado |
| GET | `/patients/:id/consultations` | ✅ | ✅ | 🟢 Integrado |
| POST | `/patients/:patientId/consultations` | ✅ | ✅ | 🟢 Integrado |
| GET | `/patients/:id/pdf` | ⚠️ | ✅ | 🟡 TODO: PDF |

**Observações:**
- Sistema completo de CRUD de pacientes
- 30+ campos de dados de saúde
- Histórico de consultas implementado
- Geração de PDF: endpoint criado, aguardando biblioteca (pdfkit/puppeteer)
- Busca por nome/CPF com paginação OK

---

## 📅 Agendamentos (`/api/appointments`)

| Método | Endpoint | Controller | Service (App) | Status |
|--------|----------|------------|---------------|--------|
| POST | `/appointments` | ✅ | ✅ | 🟢 Integrado |
| GET | `/appointments` | ✅ | ✅ | 🟢 Integrado |
| GET | `/appointments/:id` | ✅ | ✅ | 🟢 Integrado |
| PUT | `/appointments/:id` | ✅ | ✅ | 🟢 Integrado |
| DELETE | `/appointments/:id` | ✅ | ✅ | 🟢 Integrado |
| GET | `/appointments/available/:nutritionistId/:date` | ✅ | ✅ | 🟢 Integrado |

**Observações:**
- Sistema completo de agendamentos
- Slots disponíveis por nutricionista e data
- Cancelamento de consultas
- Status: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED

---

## 🍳 Receitas (`/api/recipes`)

| Método | Endpoint | Controller | Service (App) | Status |
|--------|----------|------------|---------------|--------|
| POST | `/recipes` | ✅ | ✅ | 🟢 Integrado |
| GET | `/recipes` | ✅ | ✅ | 🟢 Integrado |
| GET | `/recipes/:id` | ✅ | ✅ | 🟢 Integrado |
| PUT | `/recipes/:id` | ✅ | ❌ | 🟡 Backend OK |
| DELETE | `/recipes/:id` | ✅ | ❌ | 🟡 Backend OK |

**Observações:**
- Criação e listagem de receitas OK
- Edição e exclusão implementadas no backend
- Falta integração UI para editar/deletar receitas

---

## 🍽️ Planos Alimentares (`/api/meal-plans`)

| Método | Endpoint | Controller | Service (App) | Status |
|--------|----------|------------|---------------|--------|
| POST | `/meal-plans` | ✅ | ✅ | 🟢 Integrado |
| GET | `/meal-plans` | ✅ | ✅ | 🟢 Integrado |
| GET | `/meal-plans/:patientId/today` | ✅ | ✅ | 🟢 Integrado |
| GET | `/meal-plans/:id` | ✅ | ✅ | 🟢 Integrado |
| PUT | `/meal-plans/:id` | ✅ | ❌ | 🟡 Backend OK |
| PUT | `/meal-plans/:planId/meals/:mealId/consume` | ✅ | ✅ | 🟢 Integrado |
| DELETE | `/meal-plans/:planId` | ✅ | ✅ | 🟢 Integrado |

**Observações:**
- Sistema de planos alimentares completo
- Marcar refeições como consumidas OK
- Plano do dia do paciente funcionando
- Atualização de planos disponível no backend

---

## ⚙️ Features/Funcionalidades (`/api/features`)

| Método | Endpoint | Controller | Service (App) | Status |
|--------|----------|------------|---------------|--------|
| GET | `/features/patient/:patientId` | ✅ | ✅ | 🟢 Integrado |
| PUT | `/features/:patientId` | ✅ | ✅ | 🟢 Integrado |
| POST | `/features/:patientId/schedule` | ✅ | ❌ | 🟡 Backend OK |
| GET | `/features/scheduled/:patientId` | ✅ | ❌ | 🟡 Backend OK |
| PATCH | `/features/:patientId/toggle` | ✅ | ✅ | 🟢 Integrado |

**Observações:**
- Sistema de controle de funcionalidades por paciente
- Permite ativar/desativar módulos (receitas, plano alimentar, etc)
- Agendamento de features para datas específicas implementado no backend

---

## 📊 Resumo por Módulo

### 🟢 Totalmente Integrados (7 módulos)
1. **Autenticação** - Login, registro, refresh token
2. **Perfil de Usuário** - Visualização e edição
3. **Pacientes** - CRUD completo + histórico de consultas
4. **Agendamentos** - Sistema completo com slots disponíveis
5. **Receitas** - Criação e visualização
6. **Planos Alimentares** - Sistema completo
7. **Features** - Controle de funcionalidades por paciente

### 🟡 Parcialmente Integrados (3 áreas)
1. **Reset de senha** - Backend OK, falta UI
2. **Edição de receitas** - Backend OK, falta UI
3. **Agendamento de features** - Backend OK, falta UI

### 🔴 Pendentes (1 área)
1. **Geração de PDF** - Endpoint criado, precisa biblioteca

---

## 🎯 Próximos Passos Recomendados

### Alta Prioridade
1. ✅ Criar tela de detalhes do paciente (com histórico)
2. 📄 Implementar geração de PDF (react-native-pdf ou expo-print)
3. 📧 Sistema de mensagens nutricionista-paciente
4. 🔐 Fluxo de reset de senha completo

### Média Prioridade
5. ✏️ Edição e exclusão de receitas na UI
6. 📊 Dashboard com estatísticas (gráficos)
7. 🔔 Sistema de notificações push
8. 📸 Upload de fotos de progresso do paciente

### Baixa Prioridade
9. 🌐 Agendamento futuro de features
10. 📤 Exportação de dados em outros formatos
11. 🎨 Temas customizados
12. 🌍 Suporte multilíngue

---

## 🔧 Tecnologias Utilizadas

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL (Neon)
- JWT Authentication
- TypeScript

**Frontend:**
- React Native + Expo SDK 54
- TypeScript
- Zustand (State Management)
- Expo Router (File-based routing)
- Axios (HTTP Client)

---

## 📝 Notas de Desenvolvimento

1. **Autenticação:** Todas as rotas (exceto auth) exigem token JWT
2. **Autorização:** Alguns endpoints restritos a ADMIN/NUTRITIONIST
3. **Validação:** Express-validator implementado nas rotas principais
4. **Paginação:** Implementada em listagens de pacientes
5. **Busca:** Suporta busca por nome/CPF em pacientes
6. **Cálculos:** IMC calculado automaticamente ao criar/atualizar paciente

---

**Legenda:**
- ✅ Implementado e funcionando
- ⚠️ Parcialmente implementado
- ❌ Não implementado
- 🟢 Totalmente integrado
- 🟡 Backend pronto, falta frontend
- 🔴 Não implementado
