# 🚀 Guia de Deploy - Nutri Mobile

## 📋 Pré-requisitos

### **Desenvolvimento**
- ✅ Node.js 18+ instalado
- ✅ Expo CLI instalado globalmente
- ✅ Conta no Expo (para EAS Build)
- ✅ Android Studio (para Android)
- ✅ Xcode (para iOS - apenas macOS)

### **Produção - API**
- ✅ Servidor com Node.js (VPS, AWS, Heroku, etc.)
- ✅ PostgreSQL (Neon, Supabase, AWS RDS, etc.)
- ✅ Domínio configurado (opcional)
- ✅ SSL/HTTPS configurado

---

## 🔧 Configuração Inicial

### **1. Instalar EAS CLI**

```bash
npm install -g eas-cli
```

### **2. Fazer Login no Expo**

```bash
eas login
```

### **3. Configurar Projeto no EAS**

```bash
cd /home/isac/Área\ de\ trabalho/nutri-mobile
eas build:configure
```

---

## 📱 Build do App Mobile

### **Desenvolvimento (Local)**

```bash
# Iniciar servidor de desenvolvimento
npm start

# ou com limpeza de cache
npx expo start --clear

# Abrir no Android
npx expo start --android

# Abrir no iOS
npx expo start --ios

# Abrir no navegador
npx expo start --web
```

### **Build APK para Teste (Android)**

```bash
# Build de preview (APK para instalar manualmente)
npm run build:android

# ou diretamente
eas build --platform android --profile preview
```

**Resultado:** APK que pode ser baixado e instalado em qualquer Android

### **Build para Produção**

```bash
# Android (Google Play Store)
eas build --platform android --profile production

# iOS (App Store)
eas build --platform ios --profile production

# Ambos
eas build --platform all --profile production
```

---

## 🖥️ Deploy da API (Backend)

### **Opção 1: VPS/Servidor Próprio**

#### **1. Preparar Servidor**

```bash
# Conectar via SSH
ssh usuario@seu-servidor.com

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2
```

#### **2. Enviar Código para Servidor**

```bash
# No seu computador local
cd api
rsync -avz --exclude 'node_modules' . usuario@seu-servidor.com:~/nutri-api/
```

#### **3. Configurar no Servidor**

```bash
# No servidor
cd ~/nutri-api

# Instalar dependências
npm install --production

# Configurar variáveis de ambiente
nano .env
```

**Arquivo `.env` de Produção:**
```env
# Database
DATABASE_URL="postgresql://usuario:senha@host:5432/nutrimobile"

# JWT
JWT_SECRET="seu-secret-super-seguro-aqui"
JWT_REFRESH_SECRET="outro-secret-ainda-mais-seguro"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="production"

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR="./uploads"

# CORS (domínio do app)
ALLOWED_ORIGINS="https://seu-dominio.com,https://api.seu-dominio.com"
```

#### **4. Executar Migrações**

```bash
npx prisma generate
npx prisma migrate deploy
```

#### **5. Iniciar com PM2**

```bash
# Build do TypeScript
npm run build

# Iniciar com PM2
pm2 start dist/index.js --name nutri-api

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

#### **6. Configurar Nginx (Reverse Proxy)**

```bash
sudo nano /etc/nginx/sites-available/nutri-api
```

```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/nutri-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### **7. Configurar SSL com Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.seu-dominio.com
```

---

### **Opção 2: Heroku**

#### **1. Instalar Heroku CLI**

```bash
curl https://cli-assets.heroku.com/install.sh | sh
heroku login
```

#### **2. Criar App**

```bash
cd api
heroku create nutri-api

# Adicionar banco de dados PostgreSQL
heroku addons:create heroku-postgresql:essential-0
```

#### **3. Configurar Variáveis de Ambiente**

```bash
heroku config:set JWT_SECRET="seu-secret"
heroku config:set JWT_REFRESH_SECRET="outro-secret"
heroku config:set NODE_ENV="production"
heroku config:set JWT_EXPIRES_IN="1h"
heroku config:set JWT_REFRESH_EXPIRES_IN="7d"
```

#### **4. Criar Procfile**

```bash
echo "web: npm run build && node dist/index.js" > Procfile
```

#### **5. Deploy**

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Executar migrações
heroku run npx prisma migrate deploy
```

---

### **Opção 3: Railway**

#### **1. Conectar Repositório**
- Acesse https://railway.app
- Conecte seu GitHub
- Selecione o repositório
- Railway detecta automaticamente Node.js

#### **2. Adicionar PostgreSQL**
- New → Database → PostgreSQL
- Copie a DATABASE_URL

#### **3. Configurar Variáveis**
- Settings → Variables
- Adicione todas as variáveis do `.env`

#### **4. Deploy Automático**
- Cada push para `main` faz deploy automático

---

## 🌐 Atualizar URL da API no App

Após fazer deploy da API, atualize a URL no app:

```typescript
// src/config/api.ts

const API_BASE_URL = __DEV__ 
  ? `http://${LOCAL_IP}:3000/api` // Desenvolvimento
  : 'https://api.seu-dominio.com/api'; // Produção
```

Rebuild o app após alterar:

```bash
eas build --platform android --profile production
```

---

## 📦 Perfis de Build

### **Development**
```bash
eas build --profile development
```
- Build rápido para testes
- Inclui ferramentas de debug
- Instalação local

### **Preview**
```bash
eas build --profile preview
```
- APK standalone
- Pode ser distribuído manualmente
- Sem debug

### **Production**
```bash
eas build --profile production
```
- Build otimizado
- Pronto para lojas (Google Play/App Store)
- Minificado e ofuscado

---

## 🏪 Publicar nas Lojas

### **Google Play Store (Android)**

#### **1. Criar Conta de Desenvolvedor**
- https://play.google.com/console
- Taxa única: $25

#### **2. Fazer Build de Produção**

```bash
eas build --platform android --profile production --auto-submit
```

#### **3. Configurar no Console**
- Upload do APK/AAB
- Screenshots
- Descrição
- Categoria
- Preço (grátis)

#### **4. Enviar para Revisão**
- Pode levar alguns dias

---

### **App Store (iOS)**

#### **1. Criar Conta Apple Developer**
- https://developer.apple.com
- $99/ano

#### **2. Fazer Build**

```bash
eas build --platform ios --profile production
```

#### **3. Upload via Transporter**
- Download: https://apps.apple.com/app/transporter
- Upload do IPA

#### **4. Configurar no App Store Connect**
- https://appstoreconnect.apple.com
- Screenshots
- Descrição
- Preço

#### **5. Enviar para Revisão**
- Pode levar 1-3 dias

---

## 🔄 CI/CD Automático

### **GitHub Actions**

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd api && npm install
      - name: Build
        run: cd api && npm run build
      - name: Deploy to VPS
        uses: easingthemes/ssh-deploy@v2.1.5
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_KEY }}
          REMOTE_HOST: ${{ secrets.HOST }}
          REMOTE_USER: ${{ secrets.USER }}
          SOURCE: "api/dist/"
          TARGET: "~/nutri-api/"

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v7
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Build Android
        run: eas build --platform android --non-interactive --no-wait
```

---

## 📊 Monitoramento

### **API**

```bash
# Ver logs do PM2
pm2 logs nutri-api

# Monitorar recursos
pm2 monit

# Status
pm2 status
```

### **App**

```bash
# Ver builds
eas build:list

# Ver logs de build
eas build:view <build-id>
```

---

## 🐛 Troubleshooting

### **"Build failed" no EAS**
- Verifique `eas.json`
- Veja logs: `eas build:view <id>`
- Certifique-se que `app.json` está correto

### **"API não responde" após deploy**
- Verifique firewall: `sudo ufw allow 3000`
- Veja logs: `pm2 logs`
- Teste localmente: `curl localhost:3000/health`

### **"CORS error" no app**
- Atualize `ALLOWED_ORIGINS` no `.env` da API
- Reinicie API: `pm2 restart nutri-api`

---

## ✅ Checklist de Deploy

### **API**
- [ ] Servidor configurado
- [ ] PostgreSQL rodando
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas
- [ ] PM2 rodando
- [ ] Nginx configurado
- [ ] SSL ativo (HTTPS)
- [ ] Testes de endpoint funcionando

### **App**
- [ ] URL da API atualizada
- [ ] Build de produção criado
- [ ] Testado localmente
- [ ] Screenshots preparados
- [ ] Descrição escrita
- [ ] Ícones criados (1024x1024)
- [ ] Conta de desenvolvedor ativa
- [ ] Publicado na loja

---

## 🎉 Resumo dos Comandos

```bash
# Desenvolvimento
npm start                # Iniciar app
cd api && npm run dev    # Iniciar API

# Build
npm run build:android    # APK de teste
npm run build:ios        # Build iOS
npm run build:all        # Ambos

# Deploy API
npm run build            # Build TypeScript
pm2 start dist/index.js  # Iniciar produção
pm2 save                 # Salvar configuração

# Monitoramento
pm2 logs                 # Ver logs
pm2 monit                # Monitor em tempo real
eas build:list           # Ver builds do app
```

---

**Status:** ✅ **Pronto para deploy!**
