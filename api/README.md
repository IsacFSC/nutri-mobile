# API Backend - Nutri Mobile

Este é o backend da aplicação Nutri Mobile, construído com Node.js, Express e Neon Postgres.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Neon Postgres** - Banco de dados serverless
- **Prisma** - ORM para TypeScript
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

## 📁 Estrutura

```
api/
├── src/
│   ├── controllers/      # Controladores de rotas
│   ├── middlewares/      # Middlewares (auth, validation)
│   ├── routes/          # Definição de rotas
│   ├── services/        # Lógica de negócio
│   ├── utils/           # Utilitários
│   └── index.ts         # Ponto de entrada
├── prisma/
│   └── schema.prisma    # Schema do banco
├── .env.example
├── package.json
└── tsconfig.json
```

## 🔧 Instalação

```bash
cd api
npm install
```

## ⚙️ Configuração

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais do Neon Postgres.

## 🗄️ Migrations

```bash
npx prisma migrate dev
npx prisma generate
```

## 🏃 Executar

```bash
npm run dev
```

## 📚 Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/reset-password` - Recuperar senha

### Usuários
- `GET /api/users/me` - Dados do usuário atual
- `PUT /api/users/me` - Atualizar perfil
- `GET /api/users/:id` - Buscar usuário

### Pacientes (Admin)
- `GET /api/patients` - Listar pacientes
- `GET /api/patients/:id` - Buscar paciente
- `POST /api/patients` - Criar paciente
- `PUT /api/patients/:id` - Atualizar paciente

### Recursos (Features)
- `GET /api/features/patient/:patientId` - Recursos do paciente
- `PUT /api/features/patient/:patientId` - Atualizar recursos
- `POST /api/features/schedule` - Agendar liberação

### Consultas
- `GET /api/appointments` - Listar consultas
- `POST /api/appointments` - Criar consulta
- `PUT /api/appointments/:id` - Atualizar consulta
- `DELETE /api/appointments/:id` - Cancelar consulta

### Planos Alimentares
- `GET /api/meal-plans` - Listar planos
- `GET /api/meal-plans/:patientId/today` - Plano do dia
- `POST /api/meal-plans` - Criar plano
- `PUT /api/meal-plans/:id` - Atualizar plano

### Receitas
- `GET /api/recipes` - Listar receitas
- `GET /api/recipes/:id` - Buscar receita
- `POST /api/recipes` - Criar receita
- `PUT /api/recipes/:id` - Atualizar receita
- `DELETE /api/recipes/:id` - Deletar receita
