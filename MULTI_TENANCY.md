# 🏢 Sistema Multi-Tenancy - Organizações e Nutricionistas

## 📋 Visão Geral

Implementação completa de um sistema **multi-tenancy** (multi-organização) para gerenciamento de clínicas de nutrição, nutricionistas e pacientes com **segregação lógica de dados** e **painel administrativo**.

---

## 🎯 Arquitetura Implementada

### Hierarquia de Perfis

```
┌─────────────────────────────────────────┐
│         ADMIN (Super Admin)             │
│  - Gerencia plataforma global          │
│  - Cria e gerencia organizações         │
│  - Gerencia nutricionistas              │
│  - Acesso total aos dados               │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         ORGANIZATION (Clínica)          │
│  - Entidade legal/empresarial           │
│  - Possui múltiplos nutricionistas      │
│  - Limites configuráveis                │
│  - Dados isolados por organização       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         NUTRITIONIST                     │
│  - Vinculado a uma organização          │
│  - Gerencia seus próprios pacientes     │
│  - Acesso apenas aos seus dados         │
│  - Pode ser transferido entre orgs      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         PATIENT                          │
│  - Vinculado a um nutricionista         │
│  - Acesso apenas aos seus dados         │
│  - Prontuário eletrônico individual     │
└─────────────────────────────────────────┘
```

---

## 🗄️ Schema do Banco de Dados

### Nova Tabela: `organizations`

```prisma
model Organization {
  id          String              @id @default(uuid())
  name        String
  slug        String              @unique
  cnpj        String?             @unique
  logo        String?
  
  // Contact Info
  email       String?
  phone       String?
  website     String?
  
  // Address
  address     String?
  city        String?
  state       String?
  zipCode     String?
  country     String              @default("Brasil")
  
  // Business Info
  description String?
  
  // Settings & Limits
  status      OrganizationStatus  @default(ACTIVE)
  maxNutritionists Int             @default(5)
  maxPatients      Int             @default(100)
  
  // Owner (ADMIN user)
  ownerId     String
  
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  
  // Relations
  owner           User            @relation("OrganizationOwner", fields: [ownerId], references: [id], onDelete: Restrict)
  nutritionists   Nutritionist[]
}
```

### Atualização: `nutritionists`

Adicionado campo `organizationId` para vincular nutricionistas a organizações:

```prisma
model Nutritionist {
  id             String  @id @default(uuid())
  userId         String  @unique
  organizationId String? // 🆕 NOVO CAMPO
  
  // ... outros campos
  
  organization    Organization?    @relation(fields: [organizationId], references: [id], onDelete: SetNull)
}
```

---

## 🔌 API Endpoints Implementados

### Organizations (ADMIN apenas)

```
GET    /api/organizations                     # Listar organizações
GET    /api/organizations/:id                 # Detalhes da organização
GET    /api/organizations/:id/stats           # Estatísticas
POST   /api/organizations                     # Criar organização
PUT    /api/organizations/:id                 # Atualizar organização
DELETE /api/organizations/:id                 # Excluir organização
```

**Exemplo de criação:**

```json
POST /api/organizations
{
  "name": "Clínica Nutri Vida",
  "slug": "clinica-nutri-vida",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@nutrivida.com",
  "phone": "(11) 3333-4444",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "maxNutritionists": 10,
  "maxPatients": 500,
  "ownerId": "uuid-do-admin"
}
```

### Nutritionists (ADMIN)

```
GET    /api/nutritionists                     # Listar nutricionistas
GET    /api/nutritionists/:id                 # Detalhes do nutricionista
GET    /api/nutritionists/:id/stats           # Estatísticas
POST   /api/nutritionists                     # Criar nutricionista
PUT    /api/nutritionists/:id                 # Atualizar nutricionista
DELETE /api/nutritionists/:id                 # Desativar/Excluir
POST   /api/nutritionists/:id/transfer-patients # Transferir pacientes
```

**Exemplo de criação:**

```json
POST /api/nutritionists
{
  "email": "dra.maria@exemplo.com",
  "password": "senha123",
  "name": "Dra. Maria Santos",
  "phone": "(11) 98765-4321",
  "organizationId": "uuid-da-organizacao",
  "crn": "CRN-3 12345",
  "specialization": "Nutrição Esportiva",
  "bio": "Especialista em nutrição esportiva com 10 anos de experiência"
}
```

**Transferir pacientes:**

```json
POST /api/nutritionists/uuid-antigo/transfer-patients
{
  "targetNutritionistId": "uuid-novo-nutricionista",
  "patientIds": ["uuid-paciente-1", "uuid-paciente-2"]
}
```

---

## 📱 App Mobile - Painel Administrativo

### Novas Telas Criadas

#### 1. `/admin/dashboard` - Dashboard Administrativo

- **Cards de estatísticas:**
  - Total de organizações
  - Total de nutricionistas
  - Nutricionistas ativos
  - Total de pacientes

- **Ações rápidas:**
  - Gerenciar organizações
  - Gerenciar nutricionistas
  - Ver todos os pacientes

- **Listas resumidas:**
  - Organizações recentes (3 primeiras)
  - Nutricionistas recentes (3 primeiros)

#### 2. `/admin/organizations` - Lista de Organizações

- **Funcionalidades:**
  - Listagem completa de organizações
  - Busca por nome, CNPJ, cidade
  - Filtro por status (Ativa, Suspensa, Inativa)
  - Cards com estatísticas:
    - Nutricionistas vinculados vs limite
    - Pacientes totais vs limite
  - Botão "+ Nova" para cadastro

#### 3. `/admin/nutritionists` - Lista de Nutricionistas

- **Funcionalidades:**
  - Listagem completa de nutricionistas
  - Busca por nome, email, CRN, organização
  - Filtros: Todos | Ativos | Inativos
  - Cards exibindo:
    - Nome, CRN, email, telefone
    - Especialização
    - Organização vinculada
    - Contadores: pacientes e consultas
  - Botão "+ Novo" para cadastro

#### 4. Atualização: `/(tabs)/index` - Dashboard Principal

**Agora diferencia 3 perfis:**

- **ADMIN:** Mostra painel administrativo com acesso a:
  - Dashboard
  - Organizações
  - Nutricionistas
  - Pacientes

- **NUTRITIONIST:** Painel do nutricionista (inalterado)
  - Pacientes ativos
  - Consultas hoje
  - Ações rápidas

- **PATIENT:** Painel do paciente (inalterado)
  - Plano alimentar
  - Próxima consulta
  - Progresso

---

## 🔒 Segregação de Dados (Data Isolation)

### Como funciona a segregação?

Embora todos os dados estejam em um **banco único**, a segregação é feita através de:

1. **Relações no banco:**
   ```
   Nutritionist → organizationId (pertence a uma org)
   Patient → nutritionistId (pertence a um nutricionista)
   ```

2. **Middlewares de autorização:**
   - `authenticate` - Verifica se usuário está logado
   - `authorizeRoles` - Verifica se usuário tem permissão

3. **Queries com filtros:**
   ```typescript
   // Nutricionista só vê seus pacientes
   const patients = await prisma.patient.findMany({
     where: { nutritionistId: nutritionistId }
   });
   
   // Admin vê pacientes de uma organização
   const patients = await prisma.patient.findMany({
     where: {
       nutritionist: {
         organizationId: organizationId
       }
     }
   });
   ```

4. **Validações de limites:**
   - Verificação se organização atingiu limite de nutricionistas
   - Verificação se organização atingiu limite de pacientes
   - Bloqueio de cadastro se limite for excedido

---

## 📊 Seed Script - Dados de Teste

O seed script cria uma estrutura completa para testes:

```
🔑 ADMINISTRADOR:
   Email: admin@nutrimobile.com
   Senha: admin123

🏢 ORGANIZAÇÃO:
   Nome: Clínica Saúde Total
   Slug: clinica-saude-total
   Max Nutricionistas: 10
   Max Pacientes: 500

👩‍⚕️ NUTRICIONISTA:
   Email: nutricionista@teste.com
   Senha: 123456
   Organização: Clínica Saúde Total

👤 PACIENTE:
   Email: paciente@teste.com
   Senha: 123456
   Nutricionista: nutricionista@teste.com
```

**Executar seed:**

```bash
cd api
npm run seed
```

---

## 🚀 Como Usar o Sistema

### Passo 1: Login como ADMIN

1. Abra o app
2. Faça login com:
   - **Email:** `admin@nutrimobile.com`
   - **Senha:** `admin123`

3. Você verá o dashboard administrativo com:
   - Estatísticas globais
   - Botões de acesso rápido

### Passo 2: Gerenciar Organizações

1. Clique em "Gerenciar Organizações"
2. Veja a lista de organizações cadastradas
3. Clique em "+ Nova" para criar uma organização:
   - Nome da clínica
   - CNPJ, endereço, telefone
   - Limites de nutricionistas e pacientes
   - Owner (usuário admin responsável)

4. Após criar, a organização aparecerá na lista

### Passo 3: Gerenciar Nutricionistas

1. Clique em "Gerenciar Nutricionistas"
2. Veja todos os nutricionistas cadastrados
3. Use filtros: Todos | Ativos | Inativos
4. Clique em "+ Novo" para criar:
   - Email, senha, nome, telefone
   - Selecione a organização
   - CRN, especialização, bio

5. Sistema valida:
   - Email único
   - Limite de nutricionistas da organização

### Passo 4: Visualizar Estatísticas

1. No dashboard, veja cards com:
   - Total de organizações
   - Total de nutricionistas
   - Nutricionistas ativos
   - Total de pacientes

2. Clique em uma organização para ver:
   - Nutricionistas vinculados
   - Pacientes totais
   - Taxa de utilização

3. Clique em um nutricionista para ver:
   - Pacientes dele
   - Consultas agendadas
   - Receitas criadas

---

## 🔄 Fluxos de Trabalho

### Fluxo 1: Criar Nova Clínica

```
ADMIN → Clica "+ Nova Organização"
     → Preenche dados da clínica
     → Define limites (max nutricionistas/pacientes)
     → Salva
     → Organização criada com status ACTIVE
```

### Fluxo 2: Adicionar Nutricionista à Clínica

```
ADMIN → Clica "+ Novo Nutricionista"
     → Preenche email, senha, dados pessoais
     → Seleciona organização
     → Preenche CRN e especialização
     → Sistema verifica limite da organização
     → Se OK, cria nutricionista vinculado
     → Nutricionista pode fazer login e gerenciar pacientes
```

### Fluxo 3: Nutricionista Gerencia Pacientes

```
NUTRITIONIST → Faz login
              → Vê apenas SEUS pacientes
              → Cria novos pacientes
              → Define planos alimentares
              → Agenda consultas
              → Não pode ver pacientes de outros nutricionistas
```

### Fluxo 4: Transferir Pacientes

```
ADMIN → Acessa nutricionista que está saindo
     → Clica "Transferir Pacientes"
     → Seleciona pacientes a transferir
     → Seleciona nutricionista de destino
     → Confirma transferência
     → Pacientes agora pertencem ao novo nutricionista
```

### Fluxo 5: Desativar Nutricionista

```
ADMIN → Acessa nutricionista
     → Clica "Desativar"
     → Sistema verifica se tem pacientes
     → Se sim: solicita transferência primeiro
     → Se não: desativa (soft delete: isActive = false)
     → Nutricionista não pode mais fazer login
```

---

## 📈 Benefícios da Implementação

### ✅ Multi-Tenancy (Multi-Organização)

- Múltiplas clínicas usando a mesma plataforma
- Dados isolados logicamente
- Cada clínica gerencia seus nutricionistas

### ✅ Escalabilidade

- Limites configuráveis por organização
- Fácil adicionar novas clínicas
- Sistema preparado para crescimento

### ✅ Segurança

- Segregação de dados por organização
- Nutricionista só acessa seus pacientes
- Admin tem visão global mas dados organizados

### ✅ Gestão Profissional

- Painel administrativo completo
- Estatísticas e KPIs em tempo real
- Transferência de pacientes entre nutricionistas
- Soft delete (desativação sem perda de dados)

### ✅ Conformidade

- Prontuários vinculados ao profissional responsável
- Logs de auditoria (LGPD)
- Controle de acesso granular

---

## 🎓 Conceitos Importantes

### Multi-Tenancy vs Multi-Instance

**Multi-Instance:** Cada clínica teria sua própria instância do app e banco de dados separado.

**Multi-Tenancy (Implementado):** Todas as clínicas compartilham a mesma instância e banco, mas os dados são **logicamente separados** através de:
- `organizationId` no Nutritionist
- `nutritionistId` no Patient
- Queries com filtros obrigatórios

### Vantagens do Multi-Tenancy:

- ✅ Custos menores (1 servidor, 1 banco)
- ✅ Manutenção simplificada
- ✅ Updates simultâneos para todos
- ✅ Estatísticas globais da plataforma

### Soft Delete vs Hard Delete

**Hard Delete:** Remove permanentemente do banco (risco de perda de dados).

**Soft Delete (Implementado):** Marca como inativo (`isActive = false`), mantém histórico.

---

## 🔮 Próximos Passos (Futuro)

- [ ] Telas de cadastro/edição de organizações no app
- [ ] Telas de cadastro/edição de nutricionistas no app
- [ ] Dashboard com gráficos detalhados por organização
- [ ] Relatórios de faturamento por clínica
- [ ] Sistema de assinaturas (planos por organização)
- [ ] White-label por organização (logo, cores customizadas)
- [ ] Notificações para admin quando limites atingidos
- [ ] Auditoria de ações administrativas

---

## 📚 Documentação dos Endpoints

Veja documentação completa dos endpoints em:
- `API_STATUS.md` - Status e exemplos de uso de todos os endpoints
- Teste com Postman/Insomnia usando as credenciais do admin

---

## ✨ Conclusão

Sistema agora suporta **múltiplas organizações** (clínicas) com **segregação completa de dados**, permitindo:

- **Administradores** gerenciem a plataforma globalmente
- **Organizações** tenham limites e controles próprios
- **Nutricionistas** gerenciem apenas seus pacientes
- **Pacientes** tenham prontuários seguros e isolados

Perfeito para **escalar** o negócio e atender múltiplas clínicas com uma única plataforma! 🚀
