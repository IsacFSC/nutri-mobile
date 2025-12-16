# 🚀 Guia de Deploy - Nutri Mobile

## 📋 Stack Tecnológica

### **Backend (API)**
- **Runtime**: Node.js 18+ com TypeScript
- **Framework**: Express.js
- **ORM**: Prisma 5.22.0
- **Banco de Dados**: PostgreSQL (Neon Serverless)
- **WebSocket**: Socket.IO (para videochamadas)
- **Autenticação**: JWT + Refresh Tokens
- **Segurança**: bcryptjs, CORS

### **Frontend (Mobile)**
- **Framework**: React Native + Expo
- **Linguagem**: TypeScript
- **Navegação**: Expo Router
- **Estado**: Zustand
- **HTTP Client**: Axios
- **WebRTC**: react-native-webrtc (requer build nativo)

---

## 🌐 Deploy da API Backend

### **Opção 1: Railway (Recomendado)**

#### 1. Criar conta no Railway
```bash
https://railway.app
```

#### 2. Instalar Railway CLI (opcional)
```bash
npm i -g @railway/cli
railway login
```

#### 3. Deploy via GitHub
1. Faça push do código para GitHub
2. No Railway: **New Project** → **Deploy from GitHub**
3. Selecione o repositório `nutri-mobile`
4. Configure o **Root Directory**: `/api`

#### 4. Variáveis de Ambiente
Adicione no Railway Dashboard:

```env
# Database (copie do seu .env atual)
DATABASE_URL="postgresql://neondb_owner:npg_kaBRzfD3Gvr7@ep-snowy-flower-acqsgk08-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT (gere novas chaves para produção)
JWT_SECRET="seu_secret_super_seguro_aqui"
JWT_REFRESH_SECRET="seu_refresh_secret_super_seguro_aqui"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="production"

# CORS (adicione o domínio do Railway)
ALLOWED_ORIGINS="https://seu-app.up.railway.app"

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR="./uploads"
```

#### 5. Comandos de Build
O Railway detectará automaticamente:
```json
{
  "build": "npx prisma generate && tsc",
  "start": "npx prisma migrate deploy && node dist/index.js"
}
```

#### 6. Obter URL da API
Após deploy: `https://seu-projeto.up.railway.app`

---

### **Opção 2: Render (Alternativa Gratuita)**

1. Acesse: https://render.com
2. **New** → **Web Service**
3. Conecte seu repositório GitHub
4. Configurações:
   - **Root Directory**: `api`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
   - **Environment**: `Node`

5. Adicione as mesmas variáveis de ambiente

---

### **Opção 3: Vercel (Serverless)**

⚠️ **Limitação**: Socket.IO não funciona bem em serverless. Use Railway ou Render para videochamadas.

```bash
cd api
npm i -g vercel
vercel
```

---

## 📱 Configurar App Mobile para Produção

### 1. Atualizar URL da API

Edite: `src/config/api.ts`

```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.70:3000/api'  // Desenvolvimento
  : 'https://seu-projeto.up.railway.app/api'; // Produção
```

### 2. Build do App

#### **Android APK (Teste)**
```bash
npx expo build:android
# ou com EAS
eas build --platform android --profile preview
```

#### **Android AAB (Google Play)**
```bash
eas build --platform android --profile production
```

#### **iOS (App Store)**
```bash
eas build --platform ios --profile production
```

### 3. Configurar EAS Build

`eas.json`:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "bundler": "metro"
      }
    }
  }
}
```

---

## 🔐 Segurança para Produção

### Backend
1. **Gerar novos JWT secrets**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Configurar CORS** corretamente com domínios específicos
3. **Habilitar rate limiting**
4. **Configurar HTTPS** (Railway/Render fazem automaticamente)

### Mobile
1. **Ofuscar código** com ProGuard (Android)
2. **Remover console.log** de produção
3. **Usar variáveis de ambiente** para chaves sensíveis

---

## 📊 Banco de Dados Neon

Seu banco Neon já está configurado e pronto para produção!

### Manter Banco Ativo
Neon pausa bancos gratuitos após inatividade. Para manter ativo:

1. **Upgrade para plano pago** (recomendado para produção)
2. **Ping periódico**: Configure um cron job para fazer requisições

```typescript
// Em DatabaseConnection.ts já temos retry logic
await DatabaseConnection.connect(); // Acorda o banco
```

---

## 🚀 Checklist de Deploy

### Backend
- [ ] Código no GitHub
- [ ] Deploy no Railway/Render
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations aplicadas
- [ ] Testes de endpoints
- [ ] URL da API funcionando

### Mobile
- [ ] API_URL atualizada
- [ ] Build gerado (APK/AAB)
- [ ] Testado em dispositivo real
- [ ] Ícone e splash screen configurados
- [ ] Versão incrementada em app.json

### Banco de Dados
- [ ] Neon em produção
- [ ] Backups configurados
- [ ] Connection pooling ativo

---

## 📦 Estrutura de Arquivos (Produção)

```
nutri-mobile/
├── api/                    # Backend Node.js
│   ├── src/               # Código TypeScript
│   ├── dist/              # Build JavaScript (gerado)
│   ├── prisma/            # Schema + Migrations
│   ├── package.json
│   └── tsconfig.json
├── app/                    # Telas React Native
├── src/                    # Componentes/Services
├── android/               # Build Android nativo
├── ios/                   # Build iOS nativo
├── app.json               # Config Expo
└── package.json           # Dependências mobile
```

---

## 🆘 Troubleshooting

### Erro "Can't reach database"
```bash
# Verificar conexão com Neon
cd api
npx prisma db pull
```

### Erro de CORS no app
Adicione a URL do Railway nas `ALLOWED_ORIGINS`

### WebRTC não funciona
- Certifique-se de usar `npx expo run:android` (não Expo Go)
- Verifique STUN servers no código

---

## 📞 Suporte

- **Railway**: https://railway.app/help
- **Neon**: https://neon.tech/docs
- **Expo**: https://docs.expo.dev
- **Prisma**: https://www.prisma.io/docs
