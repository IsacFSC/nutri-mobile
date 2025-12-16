# 🚀 Como Funciona o Deploy - Nutri Mobile

## 📦 Arquitetura no Deploy

```
┌─────────────────────────────────────────┐
│         USUÁRIOS (App Mobile)           │
│  React Native + Expo (Android/iOS)      │
└─────────────┬───────────────────────────┘
              │
              │ HTTPS/WSS
              ▼
┌─────────────────────────────────────────┐
│      SERVIDOR BACKEND (Railway)         │
│  Node.js + Express + Socket.IO          │
│  Porta: 3000                            │
└─────────────┬───────────────────────────┘
              │
              │ PostgreSQL
              ▼
┌─────────────────────────────────────────┐
│       BANCO DE DADOS (Neon)             │
│  PostgreSQL Serverless                  │
└─────────────────────────────────────────┘
```

---

## 🔵 BACKEND (API) - Como Funciona

### **Hospedagem:** Railway ou Render

### **O que acontece no deploy:**

1. **Build Automático:**
   ```bash
   npm install                    # Instala dependências
   npx prisma generate            # Gera Prisma Client
   tsc                           # Compila TypeScript → JavaScript
   ```

2. **Migrations do Banco:**
   ```bash
   npx prisma migrate deploy     # Aplica migrations no Neon
   ```

3. **Servidor Inicia:**
   ```bash
   node dist/index.js            # Executa API compilada
   ```

4. **API fica disponível em:**
   ```
   https://seu-projeto.up.railway.app
   ```

### **Endpoints Expostos:**
```
https://seu-projeto.up.railway.app/api/auth          - Autenticação
https://seu-projeto.up.railway.app/api/patients      - Pacientes
https://seu-projeto.up.railway.app/api/appointments  - Consultas
https://seu-projeto.up.railway.app/api/conversations - Chat
https://seu-projeto.up.railway.app/api/video-calls   - Videochamadas
... (todos os endpoints)
```

### **WebSocket (Socket.IO):**
```
wss://seu-projeto.up.railway.app                     - Sinalização WebRTC
```

---

## 📱 FRONTEND (Mobile App) - Como Funciona

### **Não precisa de hospedagem!**
O app mobile é distribuído diretamente para os usuários via:
- **APK** (Android - instalação direta)
- **AAB** (Google Play Store)
- **IPA** (Apple App Store)

### **O que acontece no build:**

1. **Build Nativo:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Expo Build Service:**
   - Compila todo código React Native
   - Gera binário nativo (APK/AAB/IPA)
   - Inclui todos os assets (imagens, ícones, etc)
   - Assina o app (para lojas)

3. **Resultado:**
   - Android: `app-release.apk` ou `app-release.aab`
   - iOS: `app.ipa`

4. **Distribuição:**
   - APK → Download direto no celular
   - AAB → Upload na Google Play Console
   - IPA → Upload no TestFlight/App Store

---

## 🔄 Fluxo Completo de Deploy

### **Passo 1: Deploy do Backend**

```bash
# 1. Fazer commit do código
git add .
git commit -m "Preparar para deploy"
git push origin master

# 2. No Railway:
- New Project
- Deploy from GitHub
- Selecionar repositório
- Root Directory: /api
- Adicionar variáveis de ambiente
```

**Variáveis necessárias:**
```env
DATABASE_URL=postgresql://...neon.tech/neondb
JWT_SECRET=seu_secret_super_seguro
JWT_REFRESH_SECRET=outro_secret_seguro
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=*
```

**URL gerada:**
```
https://nutri-mobile-api-production.up.railway.app
```

---

### **Passo 2: Configurar App para API em Produção**

Editar `src/config/api.ts`:

```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.70:3000/api'  // Desenvolvimento local
  : 'https://nutri-mobile-api-production.up.railway.app/api'; // PRODUÇÃO

export const API_URL_BASE = __DEV__
  ? 'http://192.168.1.70:3000'
  : 'https://nutri-mobile-api-production.up.railway.app';
```

---

### **Passo 3: Build do App Mobile**

```bash
# Instalar EAS CLI (primeira vez)
npm install -g eas-cli
eas login

# Configurar projeto
eas build:configure

# Build Android APK (teste)
eas build --platform android --profile preview

# Build Android AAB (Google Play)
eas build --platform android --profile production
```

**Durante o build:**
- Código é enviado para servidores Expo
- Build nativo é gerado na nuvem
- Link de download é fornecido
- Arquivo pronto para distribuir

---

## 📲 Como os Usuários Acessam

### **Desenvolvimento:**
```
Desenvolvedor roda: npm run dev (backend)
App conecta em: http://192.168.1.70:3000
```

### **Produção:**
```
Backend roda 24/7 no Railway
App (instalado no celular) conecta em:
https://nutri-mobile-api-production.up.railway.app
```

### **Fluxo de Uso:**
```
1. Usuário abre o app no celular
2. App faz login via API (Railway)
3. Dados são salvos no Neon (PostgreSQL)
4. Videochamadas usam WebRTC P2P + Socket.IO
5. Tudo funciona sem hospedagem do app!
```

---

## 💰 Custos

### **Backend:**
- **Railway**: $5/mês (plan Hobby) ou ~$20/mês baseado em uso
- **Render**: Grátis até 750h/mês (suficiente para MVP)

### **Banco de Dados:**
- **Neon**: Grátis até 0.5GB
- **Neon Scale**: $19/mês para produção

### **Build do App:**
- **Expo EAS**: Grátis (15 builds Android + 15 iOS/mês)
- **Expo Production**: $29/mês (builds ilimitados)

### **Lojas:**
- **Google Play**: $25 (pagamento único)
- **Apple App Store**: $99/ano

---

## 🔧 Manutenção Contínua

### **Atualizar Backend:**
```bash
git push origin master
# Railway detecta e faz redeploy automático
```

### **Atualizar App:**
```bash
# Incrementar versão em app.json
"version": "1.0.1"

# Fazer novo build
eas build --platform android --profile production

# Usuários atualizam via loja ou OTA
```

---

## ✅ Checklist Final

### Backend Pronto:
- [ ] Código no GitHub
- [ ] Deploy no Railway funcionando
- [ ] URL da API acessível
- [ ] Banco Neon conectado
- [ ] Migrations aplicadas
- [ ] Todas as rotas testadas

### App Pronto:
- [ ] API_URL configurada para produção
- [ ] Build gerado via EAS
- [ ] APK/AAB baixado
- [ ] Testado em dispositivo real
- [ ] Pronto para publicar na loja

---

## 🎯 Resultado Final

**Usuários:**
- Baixam o app da Google Play
- Instalam no celular
- Usam normalmente

**Backend:**
- Roda 24/7 no Railway
- Conecta com Neon (PostgreSQL)
- Serve requisições da API
- Gerencia WebSocket para videochamadas

**Você (desenvolvedor):**
- Atualiza código no GitHub
- Railway faz redeploy automático
- Faz novo build do app quando necessário
- Publica atualizações nas lojas
