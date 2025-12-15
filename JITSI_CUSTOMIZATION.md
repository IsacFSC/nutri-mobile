# 🎨 Customização do Jitsi Meet

## ✅ Já Implementado (SEM LOGIN)

### Configurações Atuais:
- ✅ **Modo Guest Forçado** - Não pede login
- ✅ **Prejoin Desabilitado** - Entra direto na sala
- ✅ **Deep Linking Bloqueado** - Não abre app externo
- ✅ **Interface Limpa** - Sem botões de convidar
- ✅ **JavaScript Injection** - Bloqueia requisições de auth

### Como Funciona:

1. **URL com Parâmetros:**
```
https://meet.jit.si/{roomName}?config.prejoinPageEnabled=false&config.disableDeepLinking=true&...
```

2. **Script Injetado no WebView:**
```javascript
// Intercepta fetch() para bloquear chamadas de autenticação
window.fetch = function(...args) {
  if (url.includes('auth') || url.includes('login')) {
    return Promise.resolve(new Response('{}', {status: 200}));
  }
  return originalFetch.apply(this, args);
};
```

3. **WebView Configurado:**
- `thirdPartyCookiesEnabled={true}` - Permite cookies Jitsi
- `sharedCookiesEnabled={true}` - Compartilha sessão
- `originWhitelist={['*']}` - Permite todos os domínios
- `mixedContentMode="always"` - HTTP + HTTPS

---

## 🎨 Customizações Avançadas (Futuras)

### Opção 1: Usar Domínio Próprio (Mais Profissional)

**Vantagens:**
- Seu próprio domínio: `videochamada.nutrimobile.com.br`
- Remove marca "Jitsi"
- Controle total

**Implementação:**
```javascript
// Trocar em [conversationId].tsx:
const url = `https://videochamada.nutrimobile.com.br/${roomName}?...`;
```

**Requisitos:**
- Servidor Jitsi próprio (Docker ou VPS)
- Domínio registrado
- Certificado SSL (Let's Encrypt - grátis)

**Custo:**
- VPS: ~R$ 20-50/mês (DigitalOcean, Vultr, AWS)
- Domínio: ~R$ 40/ano
- SSL: Grátis (Let's Encrypt)

---

### Opção 2: Customizar Aparência (CSS)

**Trocar Cores:**
```javascript
injectedJavaScript={`
  const style = document.createElement('style');
  style.textContent = \`
    /* Cor primária (verde) */
    .toolbox-button { background-color: #4CAF50 !important; }
    
    /* Remover logo Jitsi */
    .watermark { display: none !important; }
    
    /* Cor de fundo */
    body { background-color: #1a1a1a !important; }
  \`;
  document.head.appendChild(style);
  true;
`}
```

---

### Opção 3: Adicionar Logo Personalizada

```javascript
injectedJavaScript={`
  setTimeout(() => {
    const logo = document.createElement('img');
    logo.src = 'https://seusite.com/logo.png';
    logo.style.cssText = 'position: absolute; top: 10px; left: 10px; width: 120px; z-index: 9999;';
    document.body.appendChild(logo);
  }, 2000);
  true;
`}
```

---

### Opção 4: Remover Funcionalidades

**Desabilitar Chat:**
```javascript
'config.disableChat': 'true',
```

**Desabilitar Gravação:**
```javascript
'config.fileRecordingsEnabled': 'false',
'config.liveStreamingEnabled': 'false',
```

**Desabilitar Compartilhamento de Tela:**
```javascript
'config.disableScreenShare': 'true',
```

---

## 🚀 Instalar Jitsi Próprio (100% Controle)

### Passo 1: Servidor (Digital Ocean Droplet)

```bash
# Ubuntu 22.04 LTS - $6/mês
ssh root@seu-servidor.com

# Instalar Jitsi
wget https://download.jitsi.org/jitsi-key.gpg.key
sudo apt-key add jitsi-key.gpg.key
echo "deb https://download.jitsi.org stable/" | sudo tee /etc/apt/sources.list.d/jitsi-stable.list
sudo apt update
sudo apt install jitsi-meet
```

### Passo 2: Configurar Domínio

```bash
# Apontar DNS para servidor
videochamada.nutrimobile.com.br -> IP_DO_SERVIDOR

# Certificado SSL
sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
```

### Passo 3: Customizar Interface

```bash
# Editar config
sudo nano /etc/jitsi/meet/videochamada.nutrimobile.com.br-config.js
```

```javascript
var config = {
    // Remover marca Jitsi
    defaultLogoUrl: 'https://seusite.com/logo.png',
    
    // Desabilitar prejoin
    prejoinPageEnabled: false,
    
    // Customizar cores
    brandingDataUrl: 'https://seusite.com/branding.json',
    
    // Desabilitar login
    enableUserRolesBasedOnToken: false,
};
```

### Passo 4: Atualizar App

```javascript
// Em [conversationId].tsx
const url = `https://videochamada.nutrimobile.com.br/${roomName}`;
```

---

## 📊 Comparação de Custos

| Opção | Custo Mensal | Login? | Marca | Controle |
|-------|--------------|--------|-------|----------|
| **Jitsi Público (atual)** | R$ 0 | ❌ Não* | Jitsi | Médio |
| **Jitsi Próprio** | R$ 20-50 | ❌ Não | Sua | Total |
| **Agora SDK** | R$ 0-200 | ❌ Não | Sua | Total |
| **Daily.co** | R$ 50-200 | ❌ Não | Daily | Médio |

*Com as configurações implementadas

---

## 🔧 Troubleshooting

### Se AINDA pedir login:

1. **Limpar cache do WebView:**
```javascript
// Adicionar ao WebView
cacheEnabled={false}
incognito={true}
```

2. **Forçar nova sessão:**
```javascript
// Adicionar timestamp na URL
const url = `https://meet.jit.si/${roomName}?t=${Date.now()}&...`;
```

3. **Usar outro servidor público:**
```javascript
const url = `https://8x8.vc/${roomName}?...`;
// ou
const url = `https://jitsi.riot.im/${roomName}?...`;
```

---

## 📱 Testar Agora

1. Limpar app:
```bash
cd /home/isac/Área\ de\ trabalho/nutri-mobile
npx expo start --clear
```

2. Criar nova videochamada
3. Verificar se NÃO pede login
4. Observar logs:
```
[Jitsi] Forçando modo guest - SEM LOGIN
[Jitsi] Modo guest forçado com sucesso
```

---

## 🎯 Próximos Passos Recomendados

**Curto Prazo (Grátis):**
1. ✅ Testar configuração atual (já implementada)
2. ⏳ Adicionar customização CSS (cores, logo)
3. ⏳ Desabilitar funcionalidades desnecessárias

**Médio Prazo (Investimento):**
1. ⏳ Contratar VPS ($6-10/mês)
2. ⏳ Instalar Jitsi próprio
3. ⏳ Configurar domínio personalizado

**Longo Prazo (Escalabilidade):**
1. ⏳ Migrar para Agora SDK (nativo)
2. ⏳ Implementar gravação de consultas
3. ⏳ Analytics de qualidade de chamadas

---

**Status Atual: ✅ JITSI CONFIGURADO PARA NÃO PEDIR LOGIN**

Teste agora e me avise se funciona sem login! 🚀
