# 🔐 Sistema de Autenticação - Nutri Mobile

## 📋 Visão Geral

O sistema de autenticação implementado garante que:
- ✅ **Todas as ações requerem token JWT**
- ✅ **Rotas protegidas automaticamente**
- ✅ **Logout limpa todos os dados**
- ✅ **Refresh token automático**
- ✅ **Redirecionamento inteligente**

---

## 🏗️ Arquitetura

### **Fluxo de Autenticação**

```
┌─────────────┐
│  App Inicia │
└──────┬──────┘
       │
       ▼
┌────────────────────┐
│  Verifica Token    │
│  (AsyncStorage)    │
└────────┬───────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  ✅         ❌
Token      Sem Token
Válido     
    │         │
    ▼         ▼
/(tabs)    /login
```

### **Componentes Principais**

#### **1. `app/_layout.tsx` - Proteção de Rotas Global**

```typescript
// Verifica autenticação ao iniciar
useEffect(() => {
  loadUser();
}, []);

// Redireciona baseado no estado de autenticação
useEffect(() => {
  if (isLoading) return;
  
  const inAuthGroup = segments[0] === '(tabs)';
  
  if (!isAuthenticated && inAuthGroup) {
    router.replace('/login'); // Não autenticado
  } else if (isAuthenticated && !inAuthGroup) {
    router.replace('/(tabs)'); // Já autenticado
  }
}, [isAuthenticated, segments, isLoading]);
```

**Funcionalidades:**
- Carrega dados do usuário ao iniciar
- Protege rotas automaticamente
- Redireciona usuários não autenticados para login
- Redireciona usuários autenticados para dashboard

---

#### **2. `src/store/authStore.ts` - Gerenciamento de Estado**

```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  login: (email, password) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}
```

**Funcionalidades:**
- Estado global de autenticação (Zustand)
- Login/Logout centralizados
- Carregamento automático de dados do usuário
- Limpeza completa ao fazer logout

---

#### **3. `src/config/api.ts` - Interceptores Axios**

**Request Interceptor:**
```typescript
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@nutri:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor:**
```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Tentar refresh token
      try {
        const refreshToken = await AsyncStorage.getItem('@nutri:refreshToken');
        const response = await axios.post('/auth/refresh', { refreshToken });
        // Salvar novo token e repetir requisição
      } catch {
        // Falhou: Limpar storage e forçar logout
        await AsyncStorage.multiRemove(['@nutri:token', '@nutri:refreshToken', '@nutri:user']);
      }
    }
  }
);
```

**Funcionalidades:**
- Adiciona token JWT automaticamente em todas as requisições
- Tenta renovar token automaticamente em caso de 401
- Faz logout automático se refresh token falhar

---

#### **4. `src/services/auth.service.ts` - Serviços de Autenticação**

```typescript
class AuthService {
  static async login(email, password): Promise<User> {
    const response = await api.post('/auth/login', { email, password });
    // Salva tokens e dados do usuário no AsyncStorage
  }
  
  static async logout(): Promise<void> {
    // Limpa todos os dados de autenticação
    await AsyncStorage.multiRemove(['@nutri:token', '@nutri:refreshToken', '@nutri:user']);
  }
  
  static async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('@nutri:token');
    return !!token;
  }
}
```

---

## 🔑 Tokens e Armazenamento

### **Dados Salvos no AsyncStorage**

| Chave | Descrição | Expira |
|-------|-----------|--------|
| `@nutri:token` | JWT Access Token | 1 hora |
| `@nutri:refreshToken` | Refresh Token | 7 dias |
| `@nutri:user` | Dados do usuário (JSON) | - |

### **Estrutura do Token JWT**

```json
{
  "userId": "uuid",
  "role": "PATIENT | NUTRITIONIST | ADMIN",
  "mfaVerified": false,
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## 🚪 Fluxo de Login/Logout

### **Login**

```
1. Usuário preenche email/senha
2. app/login.tsx chama authStore.login()
3. AuthService.login() faz POST /api/auth/login
4. Backend retorna: { user, accessToken, refreshToken }
5. Tokens salvos no AsyncStorage
6. authStore atualiza estado: isAuthenticated = true
7. _layout.tsx redireciona para /(tabs)
```

### **Logout**

```
1. Usuário clica em "Sair"
2. Confirmação de logout
3. app/(tabs)/profile.tsx chama authStore.logout()
4. AuthService.logout() limpa AsyncStorage
5. authStore atualiza estado: isAuthenticated = false, user = null
6. router.replace('/login')
7. _layout.tsx mantém usuário em /login
```

---

## 🛡️ Proteção de Rotas

### **Método 1: Layout Global (Atual)**

Todas as rotas dentro de `(tabs)` são protegidas automaticamente pelo `app/_layout.tsx`.

### **Método 2: Componente ProtectedRoute**

Para proteção granular com verificação de roles:

```typescript
import { ProtectedRoute } from '@/src/components/common';
import { UserRole } from '@/src/types';

export default function AdminScreen() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.NUTRITIONIST]}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

---

## 📡 Requisições Autenticadas

### **Todas as requisições incluem token automaticamente:**

```typescript
// ✅ Token adicionado automaticamente
const response = await api.get('/patients/nutritionist/123');

// ✅ Token adicionado automaticamente
const response = await api.post('/appointments', { ... });

// ❌ Sem token (erro 401)
// Backend rejeita requisição
```

### **Tratamento de Erros 401**

```typescript
try {
  const response = await api.get('/protected-route');
} catch (error) {
  if (error.isAuthError) {
    // Sessão expirada, usuário será redirecionado para login
    Alert.alert('Sessão Expirada', 'Faça login novamente.');
  }
}
```

---

## 🔄 Refresh Token Automático

```
1. Requisição retorna 401 (token expirado)
2. Interceptor tenta refresh automaticamente
3. POST /api/auth/refresh com refreshToken
4. Backend retorna novo accessToken
5. Novo token salvo e requisição original repetida
6. Se refresh falhar: logout automático
```

---

## 🧪 Como Testar

### **1. Testar Login**
```bash
# Iniciar API
cd api && npm run dev

# Criar usuário de teste
npm run seed

# No app: fazer login
Email: paciente@teste.com
Senha: 123456
```

### **2. Testar Proteção de Rotas**
```bash
# Sem estar logado, tentar acessar /(tabs)
# Deve redirecionar para /login

# Logado, tentar acessar /login
# Deve redirecionar para /(tabs)
```

### **3. Testar Logout**
```bash
# Fazer login
# Ir para Perfil > Sair
# Confirmar logout
# Deve voltar para tela de login
# AsyncStorage deve estar limpo
```

### **4. Testar Token nas Requisições**
```bash
# Fazer login
# Abrir DevTools > Network
# Fazer qualquer ação (listar pacientes, etc)
# Verificar header: Authorization: Bearer <token>
```

### **5. Testar Token Expirado**
```bash
# Fazer login
# Aguardar 1 hora (ou modificar JWT_EXPIRES_IN para 1m)
# Fazer uma requisição
# Deve renovar token automaticamente
```

---

## 🔒 Segurança Implementada

### **Frontend**
- ✅ Tokens nunca expostos no código
- ✅ AsyncStorage criptografado (nativo)
- ✅ Refresh token automático
- ✅ Logout limpa todos os dados
- ✅ Rotas protegidas automaticamente

### **Backend (já implementado)**
- ✅ JWT com expiração curta (1h)
- ✅ Refresh token com expiração longa (7d)
- ✅ Middleware de autenticação em todas as rotas
- ✅ Verificação de MFA (se habilitado)
- ✅ Verificação de LGPD consent
- ✅ Logs de auditoria

---

## 📝 Checklist de Segurança

### **Autenticação**
- [x] Login requer email e senha
- [x] Tokens JWT com expiração
- [x] Refresh token implementado
- [x] Logout limpa todos os dados
- [x] Proteção de rotas automática

### **Autorização**
- [x] Token em todas as requisições
- [x] Middleware verifica token no backend
- [x] Roles verificadas (ADMIN, NUTRITIONIST, PATIENT)
- [x] MFA opcional implementado
- [x] LGPD consent verificado

### **Armazenamento**
- [x] Tokens em AsyncStorage (seguro)
- [x] Dados do usuário em AsyncStorage
- [x] Limpeza completa ao fazer logout
- [x] Sem dados sensíveis em memória

---

## 🚨 Problemas Comuns

### **"Token inválido" após login**
**Causa:** JWT_SECRET diferente entre frontend e backend  
**Solução:** Verificar `.env` da API

### **Redirecionamento infinito**
**Causa:** Estado de autenticação não sincronizado  
**Solução:** Limpar AsyncStorage e fazer login novamente

### **"Network Error" em requisições**
**Causa:** API não está rodando ou IP incorreto  
**Solução:** Verificar `src/config/api.ts` e iniciar API

### **Logout não funciona**
**Causa:** AsyncStorage não sendo limpo  
**Solução:** Verificar `authStore.logout()` e `AuthService.logout()`

---

## 📚 Referências

- **JWT:** https://jwt.io/
- **Axios Interceptors:** https://axios-http.com/docs/interceptors
- **AsyncStorage:** https://react-native-async-storage.github.io/async-storage/
- **Expo Router:** https://docs.expo.dev/router/introduction/
- **Zustand:** https://zustand-demo.pmnd.rs/

---

**Status:** ✅ **Sistema de autenticação completo e funcional**
