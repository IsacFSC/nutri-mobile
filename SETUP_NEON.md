# Guia de Setup - Backend com Neon Postgres

## 🗄️ Configurando Neon Postgres

### 1. Criar conta no Neon

1. Acesse [https://neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto chamado "nutri-mobile"

### 2. Obter Connection String

1. No dashboard do Neon, clique em "Connection Details"
2. Copie a **Connection String** (DATABASE_URL)
3. Exemplo:
   ```
   postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/nutrimobile?sslmode=require
   ```

### 3. Configurar .env

No diretório `api/`, crie o arquivo `.env`:

```bash
cd api
cp .env.example .env
```

Edite `.env` e cole sua connection string:

```env
DATABASE_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/nutrimobile?sslmode=require"
JWT_SECRET="minha_chave_super_secreta_123"
JWT_REFRESH_SECRET="minha_chave_refresh_456"
```

## 📦 Instalação

```bash
cd api
npm install
```

## 🔄 Migrations

Criar as tabelas no banco de dados:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 🚀 Executar API

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

A API estará rodando em `http://localhost:3000`

## 📱 Configurar App Mobile para usar a API

### 1. Atualizar package.json do app

```bash
cd .. # Voltar para raiz do projeto
cd nutri-mobile
npm install axios
```

### 2. Criar serviço de API

Crie `src/services/api.ts`:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@nutri:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('@nutri:refreshToken');
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        await AsyncStorage.setItem('@nutri:token', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falhou, fazer logout
        await AsyncStorage.multiRemove(['@nutri:token', '@nutri:refreshToken']);
        // Redirecionar para login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 3. Atualizar AuthService

Substitua o Firebase Auth pela API:

```typescript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  static async register(email: string, password: string, name: string, role = 'PATIENT') {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      name,
      role,
    });

    await AsyncStorage.setItem('@nutri:token', data.accessToken);
    await AsyncStorage.setItem('@nutri:refreshToken', data.refreshToken);

    return data.user;
  }

  static async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });

    await AsyncStorage.setItem('@nutri:token', data.accessToken);
    await AsyncStorage.setItem('@nutri:refreshToken', data.refreshToken);

    return data.user;
  }

  static async logout() {
    await AsyncStorage.multiRemove(['@nutri:token', '@nutri:refreshToken']);
  }

  static async getCurrentUser() {
    const { data } = await api.get('/users/me');
    return data;
  }
}
```

## 🧪 Testar API

### Usar Postman ou Insomnia

**1. Registrar usuário**
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "nutricionista@test.com",
  "password": "senha123",
  "name": "Dr. Silva",
  "role": "NUTRITIONIST"
}
```

**2. Login**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "nutricionista@test.com",
  "password": "senha123"
}
```

**3. Buscar usuário atual (com token)**
```
GET http://localhost:3000/api/users/me
Authorization: Bearer SEU_TOKEN_AQUI
```

## 🔄 Fluxo Completo

```
1. Frontend (React Native)
   ↓
2. Axios Request
   ↓
3. API Express (localhost:3000)
   ↓
4. Prisma ORM
   ↓
5. Neon Postgres (Cloud)
```

## 📊 Vantagens desta Arquitetura

✅ **Controle Total**: Você controla o backend  
✅ **Flexibilidade**: Adicione qualquer lógica customizada  
✅ **Portabilidade**: Pode mudar de banco facilmente  
✅ **Custo**: Neon tem plano gratuito generoso  
✅ **Performance**: Serverless, escala automaticamente  
✅ **Simplicidade**: Prisma facilita muito as queries  

## 🆚 Firebase vs API+Neon

| Aspecto | Firebase | API + Neon |
|---------|----------|------------|
| Setup | Mais rápido | Mais controle |
| Custo | Pago após limite | Free tier generoso |
| Flexibilidade | Limitado | Total |
| SQL | NoSQL (Firestore) | Postgres completo |
| Realtime | Sim (nativo) | Precisa implementar |
| Offline | Sim (nativo) | Precisa implementar |
| Complexidade | Baixa | Média |

## 🎯 Recomendação

Para este projeto, **recomendo a API + Neon** porque:

1. Você tem controle total sobre recursos por paciente
2. Queries SQL são mais flexíveis para relatórios
3. Lógica de negócio fica no backend (mais seguro)
4. Fácil adicionar features customizadas
5. Neon é grátis e performático

## 📝 Próximos Passos

1. ✅ Configurar Neon Postgres
2. ✅ Rodar migrations
3. ✅ Testar API com Postman
4. ⏳ Atualizar services do app mobile
5. ⏳ Implementar controllers restantes
6. ⏳ Deploy da API (Vercel/Railway/Render)
