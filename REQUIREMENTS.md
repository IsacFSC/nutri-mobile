# Requisitos Detalhados - Nutri Mobile

## 📋 Requisitos Funcionais

### Módulo 1: Gerenciamento de Recursos (Administrador/Nutricionista)

#### RF Admin 1.0 - Controle de Acesso a Recursos
**Descrição**: O administrador deve ser capaz de gerenciar uma lista mestra de recursos disponíveis.

**Critérios de Aceitação**:
- Sistema deve listar todos os recursos disponíveis
- Administrador pode visualizar descrição de cada recurso
- Interface deve mostrar ícones para cada recurso
- Recursos incluem:
  - Consultas Online
  - Plano Alimentar Diário
  - Biblioteca de Exercícios
  - Chat Direto
  - Acompanhamento de Progresso
  - Receitas
  - Lista de Compras
  - Lembrete de Água
  - Fotos das Refeições

**Implementação**:
- Arquivo: `src/types/index.ts` (enum FeatureKey)
- Service: `src/services/feature.service.ts`

---

#### RF Admin 1.1 - Ativação por Paciente
**Descrição**: O administrador deve ter uma visualização da lista de pacientes e, para cada paciente, um conjunto de toggles que controlam a visibilidade dos recursos.

**Critérios de Aceitação**:
- Lista todos os pacientes do nutricionista
- Para cada paciente, mostra toggles liga/desliga para cada recurso
- Mudanças são salvas instantaneamente
- Feedback visual de sucesso/erro
- Busca e filtro de pacientes

**Implementação**:
- Componente: `src/components/admin/FeatureControlPanel.tsx`
- Service: `FeatureService.toggleFeature()`
- Store: `usePatientStore`

---

#### RF Admin 1.2 - Agendamento de Liberação
**Descrição**: O administrador deve poder agendar a liberação de um recurso para uma data futura.

**Critérios de Aceitação**:
- Selecionar paciente
- Selecionar recurso a liberar
- Escolher data/hora de liberação
- Adicionar nota opcional
- Visualizar agendamentos pendentes
- Cancelar agendamento
- Notificar paciente quando recurso for liberado

**Exemplo de Uso**:
"Liberar 'Plano Alimentar - Fase 2' apenas após a consulta de retorno em 15/12/2025"

**Implementação**:
- Service: `FeatureService.scheduleFeatureRelease()`
- Cloud Function: Processar liberações agendadas (executar a cada hora)

---

#### RF Admin 1.3 - Gestão de Planos/Assinaturas
**Descrição**: O administrador deve poder criar diferentes "planos" que liberam automaticamente conjuntos diferentes de recursos.

**Critérios de Aceitação**:
- Criar planos predefinidos (Básico, Premium)
- Definir conjunto de recursos para cada plano
- Aplicar plano a paciente
- Alterar plano de paciente
- Visualizar histórico de mudanças de plano

**Planos Disponíveis**:

1. **Gratuito**
   - Acompanhamento de Progresso
   - Lembrete de Água

2. **Básico (R$ 49,90/mês)**
   - Plano Alimentar Diário
   - Receitas
   - Acompanhamento de Progresso
   - Lembrete de Água

3. **Premium (R$ 99,90/mês)**
   - Todos os recursos

4. **Personalizado**
   - Recursos selecionados individualmente

**Implementação**:
- Service: `FeatureService.applyPlanToPatient()`
- Types: `PlanType`, `Plan`

---

### Módulo 2: Agendamento e Consultas Online

#### RF 2.0 - Definição de Disponibilidade (Admin)
**Descrição**: O nutricionista deve poder definir seus horários de trabalho e bloquear horários de almoço/pausas.

**Critérios de Aceitação**:
- Configurar horários por dia da semana
- Definir múltiplos blocos de horário por dia
- Bloquear horários específicos (almoço, pausas)
- Salvar template de disponibilidade
- Visualização em calendário

**Exemplo**:
```
Segunda-feira:
  09:00 - 12:00 (Disponível)
  12:00 - 13:00 (Almoço - Bloqueado)
  13:00 - 18:00 (Disponível)
```

**Implementação**:
- Service: `AppointmentService.saveAvailability()`
- Types: `Availability`, `DayAvailability`, `TimeSlot`

---

#### RF 2.1 - Agendamento pelo Paciente
**Descrição**: O paciente, se o recurso estiver ativo, deve ver apenas os horários disponíveis e agendar uma consulta.

**Critérios de Aceitação**:
- Verificar se recurso está liberado
- Mostrar apenas horários disponíveis
- Selecionar data e horário
- Confirmar agendamento
- Receber confirmação
- Visualizar consultas agendadas

**Validações**:
- Horário deve estar disponível
- Não pode agendar no passado
- Respeitar horários de trabalho do nutricionista
- Evitar conflitos com outras consultas

**Implementação**:
- Service: `AppointmentService.createAppointment()`
- Service: `AppointmentService.getAvailableSlots()`

---

#### RF 2.2 - Confirmação e Lembretes
**Descrição**: O sistema deve enviar lembretes automáticos para ambas as partes antes da consulta.

**Critérios de Aceitação**:
- Lembrete 1 hora antes da consulta
- Notificação push
- Email opcional
- Botão para entrar na sala de vídeo
- Opção de cancelar/reagendar

**Implementação**:
- Expo Notifications
- Cloud Function para agendar lembretes
- Service: `NotificationService` (a criar)

---

#### RF 2.3 - Sala de Vídeo Conferência
**Descrição**: Integrar uma solução de vídeo para a consulta online dentro do próprio app.

**Critérios de Aceitação**:
- Criar sala de vídeo automaticamente
- Compartilhar link da sala com ambas as partes
- Entrar na sala com um clique
- Funcionalidades básicas: áudio, vídeo, chat
- Gravar consulta (opcional, com consentimento)

**Opções de Integração**:
- Daily.co
- Agora.io
- Jitsi Meet
- Stream Video

**Implementação**:
- Service: `VideoService` (a criar)
- Componente: `VideoRoom` (a criar)
- `AppointmentService.setVideoRoomUrl()`

---

### Módulo 3: Conteúdo e Planos

#### RF 3.0 - Cadastro de Alimentos/Receitas (Admin)
**Descrição**: O nutricionista deve poder cadastrar receitas, alimentos com informações nutricionais e categorias.

**Critérios de Aceitação**:
- Cadastrar alimentos individuais
- Informações nutricionais completas (calorias, proteínas, carboidratos, gorduras)
- Upload de imagem
- Categorização (Café da Manhã, Almoço, Jantar, Lanche)
- Criar receitas combinando alimentos
- Instruções passo a passo
- Tempo de preparo

**Campos Obrigatórios - Alimento**:
- Nome
- Categoria
- Porção (g/ml)
- Calorias
- Proteínas
- Carboidratos
- Gorduras

**Campos Obrigatórios - Receita**:
- Nome
- Ingredientes (alimentos + quantidades)
- Modo de preparo
- Tempo de preparo
- Categoria

**Implementação**:
- Service: `MealPlanService.createFood()`
- Service: `MealPlanService.createRecipe()`
- Types: `Food`, `Recipe`, `NutritionalInfo`

---

#### RF 3.1 - Criação de Plano Alimentar (Admin)
**Descrição**: O nutricionista deve poder montar planos arrastando e soltando receitas para dias e horários específicos.

**Critérios de Aceitação**:
- Interface drag-and-drop
- Visualização semanal
- Adicionar receitas em horários específicos
- Calcular totais nutricionais automaticamente
- Copiar dia/semana
- Templates de planos
- Aplicar plano a paciente específico

**Fluxo**:
1. Selecionar paciente
2. Escolher período (semana)
3. Arrastar receitas para dias/horários
4. Revisar totais nutricionais
5. Salvar e notificar paciente

**Implementação**:
- Service: `MealPlanService.createDailyMealPlan()`
- Service: `MealPlanService.createWeeklyMealPlan()`
- Componente: `MealPlanBuilder` (a criar)

---

#### RF 3.2 - Visualização do Plano (Paciente)
**Descrição**: O paciente deve visualizar o plano diário e semanal, podendo marcar refeições como "consumidas".

**Critérios de Aceitação**:
- Visualizar plano do dia atual
- Visualizar plano da semana
- Ver detalhes de cada refeição (ingredientes, preparo)
- Marcar refeição como consumida
- Ver progresso diário (% consumido)
- Adicionar foto da refeição
- Fazer anotações
- Ver totais nutricionais

**Implementação**:
- Service: `MealPlanService.getDailyMealPlan()`
- Service: `MealPlanService.markMealAsConsumed()`
- Componente: `MealCard` (a criar)

---

#### RF 3.3 - Biblioteca de Exercícios (Admin)
**Descrição**: Capacidade de fazer upload de vídeos ou instruções de exercícios.

**Critérios de Aceitação**:
- Cadastrar exercício
- Upload de vídeo demonstrativo
- Instruções escritas
- Categorias (Cardio, Força, Flexibilidade)
- Nível de dificuldade
- Duração estimada
- Calorias queimadas (aproximado)

**Implementação**:
- Service: `ExerciseService` (a criar)
- Firebase Storage para vídeos
- Types: `Exercise`, `ExerciseCategory`

---

#### RF 3.4 - Chat/Mensagens Diretas
**Descrição**: Um canal de comunicação assíncrona entre paciente e nutricionista para dúvidas rápidas.

**Critérios de Aceitação**:
- Enviar mensagens de texto
- Enviar fotos
- Enviar arquivos (PDFs, imagens)
- Notificação de nova mensagem
- Histórico de conversas
- Indicador de "digitando..."
- Status de leitura

**Limitações**:
- Disponível apenas se recurso liberado
- Horário de atendimento (opcional)
- Tempo de resposta esperado

**Implementação**:
- Service: `ChatService` (a criar)
- Firestore para mensagens em tempo real
- Types: `Message`, `Conversation`

---

## 🛡️ Requisitos Não Funcionais

### RNF 1.0 - Segurança de Dados
**Descrição**: Todos os dados de saúde devem ser criptografados em trânsito e em repouso.

**Critérios**:
- HTTPS para todas as comunicações
- Criptografia de dados sensíveis no Firestore
- Autenticação segura (Firebase Auth)
- Tokens JWT com expiração
- Logs de acesso
- Conformidade com LGPD
- Conformidade com HIPAA (se aplicável)

**Implementação**:
- Firebase Security Rules
- Validação server-side
- Sanitização de inputs

---

### RNF 1.1 - Performance
**Descrição**: O carregamento do plano alimentar e do agendamento deve ser rápido, mesmo com conexões lentas.

**Métricas**:
- Tempo de carregamento inicial < 3s
- Tempo de transição entre telas < 1s
- Cache de dados offline
- Lazy loading de imagens
- Paginação de listas grandes

**Otimizações**:
- Image optimization
- Code splitting
- Memoização de componentes
- Debounce em buscas
- Compressão de imagens

---

### RNF 1.2 - Compatibilidade
**Descrição**: O aplicativo deve funcionar em dispositivos iOS e Android.

**Suporte**:
- iOS 13+
- Android 8.0+
- Tablets (iPad, Android tablets)
- Diferentes tamanhos de tela
- Orientação portrait e landscape

**Testes**:
- Testes em diferentes dispositivos
- Testes de responsividade
- Testes de acessibilidade

---

### RNF 1.3 - Autenticação Segura
**Descrição**: Usar um provedor de autenticação robusto para login e cadastro.

**Recursos**:
- Login com email/senha
- Recuperação de senha
- Verificação de email
- Login social (Google, Apple) - futuro
- 2FA (Two-Factor Authentication) - futuro

**Implementação**:
- Firebase Authentication
- Validação de força de senha
- Rate limiting para tentativas de login
- Bloqueio de conta após tentativas falhas

---

## 📊 Casos de Uso

### UC-01: Nutricionista Libera Recurso para Paciente

**Ator Principal**: Nutricionista

**Pré-condições**:
- Nutricionista autenticado
- Paciente cadastrado no sistema

**Fluxo Principal**:
1. Nutricionista acessa lista de pacientes
2. Seleciona um paciente
3. Visualiza painel de recursos
4. Ativa toggle do recurso desejado
5. Sistema salva alteração
6. Paciente recebe notificação
7. Recurso aparece no app do paciente

**Pós-condições**:
- Recurso visível para o paciente
- Log de alteração registrado

---

### UC-02: Paciente Agenda Consulta

**Ator Principal**: Paciente

**Pré-condições**:
- Paciente autenticado
- Recurso "Consultas Online" liberado
- Nutricionista configurou disponibilidade

**Fluxo Principal**:
1. Paciente acessa tela de agendamento
2. Seleciona data desejada
3. Sistema mostra horários disponíveis
4. Paciente seleciona horário
5. Confirma agendamento
6. Sistema cria consulta
7. Ambos recebem confirmação
8. Lembrete agendado

**Pós-condições**:
- Consulta agendada
- Notificações programadas

---

### UC-03: Paciente Visualiza Plano Alimentar

**Ator Principal**: Paciente

**Pré-condições**:
- Paciente autenticado
- Recurso "Plano Alimentar" liberado
- Nutricionista criou plano para o paciente

**Fluxo Principal**:
1. Paciente acessa plano alimentar
2. Visualiza refeições do dia
3. Seleciona uma refeição
4. Vê detalhes (ingredientes, preparo)
5. Marca refeição como consumida
6. Adiciona foto (opcional)
7. Faz anotação (opcional)

**Pós-condições**:
- Progresso atualizado
- Nutricionista pode ver consumo

---

## 🎯 Priorização (MoSCoW)

### Must Have (Essencial)
- ✅ Autenticação de usuários
- ✅ Controle de recursos por paciente
- ✅ CRUD de receitas e alimentos
- ✅ Criação de planos alimentares
- ✅ Visualização de plano pelo paciente
- ✅ Agendamento de consultas

### Should Have (Importante)
- Notificações push
- Chat entre nutricionista e paciente
- Acompanhamento de progresso (peso, medidas)
- Biblioteca de exercícios
- Upload de fotos de refeições

### Could Have (Desejável)
- Agendamento de liberação de recursos
- Templates de planos alimentares
- Lista de compras gerada automaticamente
- Integração com balança inteligente
- Exportação de relatórios PDF

### Won't Have (Não terá agora)
- Integração com wearables (smartwatch)
- Pagamentos in-app
- Marketplace de nutricionistas
- IA para sugestões de receitas
- Comunidade/fórum de pacientes

---

**Versão**: 1.0
**Data**: 6 de dezembro de 2025
**Autor**: Equipe Nutri Mobile
