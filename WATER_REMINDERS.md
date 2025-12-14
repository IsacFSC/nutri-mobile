# Sistema de Lembretes de Hidratação 💧

## Visão Geral

O sistema de lembretes de hidratação permite que pacientes configurem notificações automáticas para lembrar de beber água ao longo do dia. As notificações são totalmente personalizáveis e independentes para cada paciente.

## Funcionalidades

### Para Pacientes

1. **Ativar/Desativar Lembretes**
   - Switch simples para habilitar ou desabilitar as notificações
   - Solicitação de permissão de notificações no primeiro uso

2. **Configuração de Horários**
   - Horário de início (ex: 08:00)
   - Horário de término (ex: 22:00)
   - Seletor de tempo nativo do dispositivo

3. **Intervalo entre Lembretes**
   - Opções: 30min, 1h, 1h30, 2h, 3h
   - Quantidade de lembretes calculada automaticamente

4. **Meta Diária de Água**
   - Opções: 1L, 1.5L, 2L, 2.5L, 3L, 3.5L, 4L
   - Referência visual para o objetivo diário

5. **Mensagens Variadas**
   - 5 mensagens diferentes rotativas
   - Evita monotonia nas notificações

## Arquitetura

### Arquivos Criados

1. **`src/services/notifications.service.ts`**
   - Serviço centralizado para gerenciamento de notificações
   - Funções de permissão, agendamento e cancelamento
   - Persistência de configurações no AsyncStorage

2. **`app/(tabs)/water-reminder.tsx`**
   - Tela de configuração de lembretes
   - Interface intuitiva com cards organizados
   - Disponível apenas para pacientes

### Integração com Tabs

- Nova aba "Água" adicionada ao menu inferior
- Ícone: `water` (Ionicons)
- Visível apenas para usuários com role `PATIENT`

## Fluxo de Uso

```
1. Paciente acessa aba "Água"
2. Ativa o switch de lembretes
3. Sistema solicita permissão de notificações
4. Paciente configura:
   - Horário de início e término
   - Intervalo entre lembretes
   - Meta diária de água
5. Sistema agenda notificações automaticamente
6. Paciente recebe lembretes nos horários configurados
```

## Detalhes Técnicos

### Persistência de Dados

```typescript
// Configuração salva no AsyncStorage
interface WaterReminderConfig {
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  intervalMinutes: number;
  dailyGoalLiters: number;
}
```

### Agendamento de Notificações

- Utiliza `expo-notifications`
- Notificações recorrentes diárias
- Canal dedicado no Android: "water-reminders"
- Prioridade alta para visibilidade
- Som e vibração habilitados

### Cálculo de Lembretes

```typescript
// Exemplo: 08:00 - 22:00 com intervalo de 1h
// Total: 14 horas = 840 minutos
// Lembretes: 840 / 60 = 14 lembretes por dia
```

### Mensagens de Notificação

1. "💧 Hora de beber água! Hidrate-se agora."
2. "🚰 Lembrete: Beba um copo de água!"
3. "💦 Que tal um copo de água agora?"
4. "🌊 Hidratação é saúde! Beba água."
5. "💧 Seu corpo precisa de água! Beba agora."

## Permissões Necessárias

### Android (app.json)

```json
{
  "android": {
    "permissions": [
      "NOTIFICATIONS",
      "SCHEDULE_EXACT_ALARM"
    ]
  }
}
```

### iOS (app.json)

```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["remote-notification"]
    }
  }
}
```

## Testes

### Casos de Teste

1. **Ativar Lembretes**
   - Verificar solicitação de permissão
   - Confirmar agendamento de notificações
   - Validar contagem de lembretes agendados

2. **Desativar Lembretes**
   - Verificar cancelamento de notificações
   - Confirmar contagem zerada

3. **Alterar Configurações**
   - Mudar horários e verificar reagendamento
   - Alterar intervalo e validar nova quantidade
   - Modificar meta diária

4. **Receber Notificações**
   - Aguardar horário configurado
   - Verificar recebimento da notificação
   - Validar som e vibração

## UI/UX

### Design

- **Header**: Ícone grande de água + título + descrição
- **Status Card**: Mostra quantidade de lembretes ativos (verde)
- **Cards de Configuração**: Separados por função
- **Botões de Opção**: Grid responsivo com destaque visual
- **Info Card**: Dica sobre hidratação (azul claro)

### Cores

- Primária: `#4CAF50` (verde)
- Sucesso: `#4CAF50` com fundo `#E8F5E9`
- Info: `#2196F3` com fundo `#E3F2FD`

### Espaçamento

- Padding cards: `Spacing.lg`
- Gap entre elementos: `Spacing.md`
- Margens laterais: `Spacing.md`

## Melhorias Futuras

1. **Tracking de Consumo**
   - Botão para registrar água consumida
   - Gráfico de progresso diário
   - Histórico semanal/mensal

2. **Integração com Plano Alimentar**
   - Ajustar lembretes baseado em refeições
   - Recomendações personalizadas do nutricionista

3. **Gamificação**
   - Sistema de conquistas
   - Streaks de dias consecutivos
   - Badges por metas alcançadas

4. **Analytics**
   - Relatório de adesão aos lembretes
   - Taxa de hidratação por período
   - Compartilhamento com nutricionista

5. **Notificações Inteligentes**
   - Ajuste baseado em clima/temperatura
   - Intensidade por atividade física
   - Machine learning para otimizar horários

## Comandos Úteis

```bash
# Testar notificações localmente
npx expo start

# Ver notificações agendadas (debug)
# Adicionar log no código:
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log(scheduled);

# Limpar todas notificações
await Notifications.cancelAllScheduledNotificationsAsync();
```

## Troubleshooting

### Notificações não aparecem no Android

1. Verificar permissões no dispositivo
2. Confirmar que o canal está criado
3. Checar prioridade da notificação
4. Validar que o app não está em economia de bateria

### Notificações não aparecem no iOS

1. Confirmar permissão concedida
2. Verificar que não está em "Não Perturbe"
3. Checar configurações do app no iOS
4. Validar certificados APNs (produção)

### Horários incorretos

1. Verificar timezone do dispositivo
2. Confirmar formato 24h no DateTimePicker
3. Validar cálculo de minutos desde meia-noite

## Suporte

Para dúvidas ou problemas:
1. Verificar logs no console
2. Testar com configurações padrão
3. Revisar permissões do dispositivo
4. Consultar documentação do expo-notifications

---

**Desenvolvido com ❤️ para promover uma vida mais saudável através da hidratação adequada!** 💧
