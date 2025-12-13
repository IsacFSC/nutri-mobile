# 📱 Guia de Teste - Painel do Paciente

## 🎯 Objetivo
Este guia mostra como criar e testar o login de pacientes no Nutri Mobile.

---

## 🚀 Passo a Passo para Testar

### **1. Criar Usuário Paciente de Teste**

Execute o script de seed que cria automaticamente:
- 1 paciente de teste (com todos os recursos habilitados)
- 1 nutricionista de teste (para gerenciar o paciente)

```bash
cd api
npm run seed
```

**Saída esperada:**
```
🌱 Criando usuários de teste...
✅ Paciente criado
✅ Nutricionista criado
✅ Paciente vinculado ao nutricionista

🎉 Seed concluído com sucesso!

📋 Credenciais de teste:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 PACIENTE:
   Email: paciente@teste.com
   Senha: 123456

👩‍⚕️ NUTRICIONISTA:
   Email: nutricionista@teste.com
   Senha: 123456
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **2. Iniciar o Servidor da API**

```bash
cd api
npm run dev
```

Aguarde a mensagem:
```
🚀 Servidor rodando na porta 3000
```

---

### **3. Iniciar o App Mobile**

Em outro terminal:

```bash
# Se for Android
npx expo start --android

# Se for iOS
npx expo start --ios

# Ou Expo Go
npx expo start
```

---

### **4. Fazer Login como Paciente**

Na tela de login do app:
- **Email:** `paciente@teste.com`
- **Senha:** `123456`

---

## 📊 O Que Você Verá no Painel do Paciente

### **Tela Inicial (Dashboard)**

```
┌─────────────────────────────────────┐
│  Olá, João!                         │
│  Meu Acompanhamento                 │
├─────────────────────────────────────┤
│  Bem-vindo ao Nutri Mobile          │
│  Acompanhe seu plano alimentar...   │
├─────────────────────────────────────┤
│  Ações Rápidas:                     │
│  ┌──────┐ ┌──────┐                 │
│  │  🍽️  │ │  📅  │                 │
│  │ Meu  │ │Consul│                 │
│  │Cardá │ │ tas  │                 │
│  │ pio  │ │      │                 │
│  └──────┘ └──────┘                 │
│  ┌──────┐ ┌──────┐                 │
│  │  🛡️  │ │  📷  │                 │
│  │Segu- │ │ Meu  │                 │
│  │rança │ │Avatar│                 │
│  │ MFA  │ │      │                 │
│  └──────┘ └──────┘                 │
├─────────────────────────────────────┤
│  Recursos Disponíveis               │
│  Confira os recursos liberados...   │
└─────────────────────────────────────┘
```

### **Bottom Navigation**

```
┌────────┬──────────┬──────────┬────────┐
│  🏠    │   🍽️    │   📅    │   👤   │
│ Início │  Plano   │Consultas│ Perfil │
│        │Alimentar │         │        │
└────────┴──────────┴──────────┴────────┘
```

### **Menu de Perfil**

Ao tocar em "Perfil":

```
┌─────────────────────────────────────┐
│  📋 Dados Pessoais                  │
├─────────────────────────────────────┤
│  🛡️ Autenticação MFA (azul)        │
├─────────────────────────────────────┤
│  📷 Alterar Avatar (laranja)        │
├─────────────────────────────────────┤
│  🔒 Segurança                       │
├─────────────────────────────────────┤
│  📜 LGPD/Privacidade (verde)        │
├─────────────────────────────────────┤
│  ✨ Recursos Disponíveis            │
├─────────────────────────────────────┤
│  🔔 Notificações                    │
├─────────────────────────────────────┤
│  ❓ Ajuda                           │
├─────────────────────────────────────┤
│  🚪 Sair                            │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Teste

Teste as seguintes funcionalidades:

### **Autenticação**
- [ ] Login com email/senha do paciente
- [ ] Validação de campos (email inválido, senha curta)
- [ ] Mensagem de erro para credenciais inválidas
- [ ] Logout

### **Dashboard**
- [ ] Exibe saudação personalizada com nome
- [ ] Mostra "Meu Acompanhamento" como subtítulo
- [ ] 4 botões de ações rápidas visíveis
- [ ] Todos os botões são clicáveis (tocáveis)

### **Navegação**
- [ ] Bottom tabs funcionam
- [ ] Tab "Início" selecionada por padrão
- [ ] Tab "Plano Alimentar" visível apenas para paciente
- [ ] Tab "Consultas" visível apenas para paciente
- [ ] Tab "Perfil" funciona

### **Menu de Perfil**
- [ ] Exibe 9 opções de menu
- [ ] Itens MFA, Avatar e LGPD com cores diferentes
- [ ] Botão "Sair" no final
- [ ] Tocar em "Sair" faz logout

---

## 🔄 Testar Também como Nutricionista

Para ver a diferença entre painéis:

**Login como Nutricionista:**
- **Email:** `nutricionista@teste.com`
- **Senha:** `123456`

**Diferenças no Dashboard:**
- Saudação: "Olá, Dr(a). Maria!"
- Subtítulo: "Painel do Nutricionista"
- Estatísticas: "Pacientes Ativos" e "Consultas Hoje"
- Ações rápidas diferentes (Novo Paciente, Agendar, etc.)
- Bottom tabs diferentes (Receitas, Agenda, Pacientes)

---

## 🐛 Problemas Comuns

### **❌ Erro ao fazer login: "Network Error" ou timeout**

**Causa:** O app não consegue se conectar à API.

**Soluções:**

1. **Verifique se a API está rodando:**
   ```bash
   cd api
   npm run dev
   ```
   Deve mostrar: `🚀 Servidor rodando na porta 3000`

2. **Configure o IP correto no arquivo `src/config/api.ts`:**
   
   Abra o arquivo e atualize a constante `LOCAL_IP`:
   ```typescript
   const LOCAL_IP = '192.168.1.70'; // SEU IP ATUAL
   ```
   
   **Como descobrir seu IP:**
   ```bash
   # Linux/Mac
   hostname -I | awk '{print $1}'
   
   # Windows
   ipconfig
   ```

3. **Verifique o CORS na API:**
   
   No arquivo `api/.env`, adicione seu IP:
   ```
   ALLOWED_ORIGINS="http://192.168.1.70:19000,http://192.168.1.70:19006"
   ```

4. **Reinicie a API** após alterar o `.env`

5. **Reinicie o app Expo** após alterar o `api.ts`

**Se estiver usando:**
- **Expo Go em celular:** Use o IP da sua máquina (ex: 192.168.1.70)
- **Android Emulator:** Use `10.0.2.2`
- **iOS Simulator:** Use `localhost`

---

### **Erro: "Falha ao carregar pacientes"**
- ✅ **Já corrigido!** O patient controller agora busca o nutricionista pelo userId primeiro

### **Erro: "Email não verificado"**
- ✅ **Já corrigido!** A validação só ocorre em produção (NODE_ENV='production')

### **Erro: "Token inválido"**
- Faça logout e login novamente
- Verifique se o JWT_SECRET está correto no `.env`

### **Telas não implementadas mostram erro**
- ✅ **Normal!** As telas de Plano Alimentar, Consultas, MFA e Avatar ainda não foram criadas
- Você verá tela em branco ou erro 404

---

## 📝 Dados do Paciente de Teste

O paciente criado pelo seed tem:

```json
{
  "name": "João Silva Paciente",
  "email": "paciente@teste.com",
  "phone": "(11) 98765-4321",
  "cpf": "123.456.789-00",
  "birthDate": "1990-05-15",
  "gender": "MASCULINO",
  "weight": 75.5,
  "height": 175,
  "planType": "PREMIUM",
  "goals": "Perder peso e ganhar massa muscular",
  
  "recursos_habilitados": {
    "enabledMealPlan": true,
    "enabledRecipes": true,
    "enabledAppointments": true,
    "enabledProgress": true,
    "enabledChat": true,
    "enabledVideoCall": true,
    "enabledReports": true
  }
}
```

---

## 🎨 Próximos Passos

### **Telas a Desenvolver:**

1. **Plano Alimentar (`/meal-plan`)**
   - Visualizar cardápio diário
   - Refeições por horário
   - Informações nutricionais

2. **Consultas (`/appointments`)**
   - Lista de consultas agendadas
   - Histórico de consultas
   - Botão para agendar nova consulta

3. **MFA Setup**
   - QR Code para Google Authenticator
   - Input de código TOTP
   - Exibir backup codes

4. **Upload de Avatar**
   - Escolher foto da galeria
   - Tirar foto com câmera
   - Prévia e crop da imagem

5. **LGPD**
   - Ver logs de auditoria
   - Solicitar exportação de dados
   - Solicitar exclusão de conta

---

## 📞 Suporte

Se encontrar algum problema:
1. Verifique se a API está rodando (`npm run dev`)
2. Verifique se o banco de dados está acessível
3. Veja os logs do terminal da API
4. Veja os logs do Expo no terminal do app

---

**Status Atual:** ✅ **Painel do paciente funcional com navegação e ações rápidas implementadas**
