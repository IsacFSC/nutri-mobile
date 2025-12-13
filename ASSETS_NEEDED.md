# 🎨 Assets Necessários para Build

## ⚠️ ATENÇÃO: Arquivos Obrigatórios Ausentes

Para fazer o build do app, você precisa criar os seguintes arquivos de imagem na pasta `assets/`:

---

## 📱 **1. Icon (Ícone do App)**

**Caminho:** `assets/icon.png`

### Especificações:
- **Tamanho:** 1024x1024 pixels
- **Formato:** PNG com transparência
- **Fundo:** Pode ter cor sólida ou transparente
- **Conteúdo:** Logo do Nutri Mobile

### Dicas de Design:
- Use um símbolo relacionado à nutrição (prato, maçã, folha, etc.)
- Cores: Verde (#4ADE80), Laranja (#FB923C), ou paleta personalizada
- Mantenha simples - será reduzido para 48x48px em alguns contextos
- Teste em fundo claro e escuro

### Ferramentas para Criar:
- **Online:** Canva (https://canva.com) - grátis
- **Desktop:** Figma, Photoshop, GIMP
- **IA:** DALL-E, Midjourney (gere e ajuste)

---

## 🌅 **2. Splash Screen (Tela de Carregamento)**

**Caminho:** `assets/splash.png`

### Especificações:
- **Tamanho:** 1284x2778 pixels (proporção iPhone)
- **Formato:** PNG
- **Fundo:** Cor sólida (ex: #10B981 - verde)
- **Conteúdo:** Logo centralizado + nome do app

### Layout Sugerido:
```
┌─────────────────┐
│                 │
│                 │
│      [LOGO]     │  ← Logo 400x400px
│   Nutri Mobile  │  ← Texto branco
│                 │
│                 │
└─────────────────┘
```

### Dicas:
- Fundo degradê (de verde escuro para verde claro)
- Logo deve ter no máximo 40% da altura da tela
- Adicione tagline: "Nutrição ao seu alcance"

---

## 📐 **3. Adaptive Icon (Android)**

**Caminho:** `assets/adaptive-icon.png`

### Especificações:
- **Tamanho:** 1024x1024 pixels
- **Formato:** PNG com transparência
- **Área segura:** 664x664px centralizados (círculo interno)
- **Pode ser cortado:** Android corta em círculo/quadrado/squircle

### Como Criar:
- Use o mesmo design do icon.png
- Certifique-se que o logo principal está na área segura central
- Evite texto ou detalhes finos nas bordas

---

## 🔧 Geradores Rápidos

### **Option 1: Icon Generator**
https://icon.kitchen
- Upload uma imagem simples
- Gera todos os tamanhos automaticamente
- Download icon.png, splash.png, adaptive-icon.png

### **Option 2: Expo Icon Generator**
https://buildicon.netlify.app
- Específico para Expo
- Upload uma imagem 1024x1024
- Baixe os 3 arquivos

### **Option 3: Figma Template**
https://www.figma.com/community/file/1155362909441341285
- Template gratuito para Expo icons
- Personalize cores e logo
- Exporte os 3 arquivos

---

## 📦 Após Criar os Arquivos

1. **Coloque na pasta assets:**
```bash
assets/
├── icon.png          # 1024x1024
├── splash.png        # 1284x2778
└── adaptive-icon.png # 1024x1024
```

2. **Verifique no app.json:**
```json
{
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash.png",
    "backgroundColor": "#10B981"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#10B981"
    }
  }
}
```

3. **Teste localmente:**
```bash
npx expo start
# Veja o ícone no Expo Go
```

4. **Faça o build:**
```bash
npm run build:android
```

---

## 🎨 Paleta de Cores Sugerida

### Verde Saúde
- **Primary:** #10B981 (Emerald-500)
- **Dark:** #059669 (Emerald-600)
- **Light:** #34D399 (Emerald-400)

### Laranja Energia
- **Primary:** #F97316 (Orange-500)
- **Dark:** #EA580C (Orange-600)
- **Light:** #FB923C (Orange-400)

---

## 🚨 Erros Comuns

### "icon.png not found"
- Certifique-se que o arquivo está em `assets/icon.png`
- Use caminho relativo no app.json: `"./assets/icon.png"`

### "Invalid dimensions"
- icon.png deve ser exatamente 1024x1024
- splash.png deve ter proporção 9:19.5 (1284x2778)

### "Build failed on splash"
- Verifique backgroundColor no app.json
- Use código hexadecimal: `"#10B981"`

---

## ✅ Checklist

- [ ] `assets/icon.png` criado (1024x1024)
- [ ] `assets/splash.png` criado (1284x2778)
- [ ] `assets/adaptive-icon.png` criado (1024x1024)
- [ ] Arquivos têm cores consistentes
- [ ] Logo está na área segura (adaptive icon)
- [ ] Testado no Expo Go
- [ ] Build executado sem erros

---

**Status:** ⏳ **Aguardando criação dos assets**

Após criar os arquivos, rode:
```bash
npm run build:android
```
