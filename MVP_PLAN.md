# AXION Cred - Plano de Desenvolvimento MVP

## ✅ Funcionalidades Concluídas (v1.0)

### 1. Landing Page
- [x] Hero section com CTA
- [x] Recursos/Features
- [x] Benefícios
- [x] Contato
- [x] Tradução (PT/EN/ES)

### 2. Autenticação
- [x] Login com e-mail/senha
- [x] Registro de usuários
- [x] Logout
- [x] Sessão persistente (demo mode)
- [x] Proteção de rotas

### 3. Dashboard
- [x] KPIs principais (clientes, empréstimos, valores)
- [x] Dashboard avançado com gráficos
- [x] Lista de últimos empréstimos
- [x] Clientes inadimplentes

### 4. Gestão de Clientes
- [x] Lista de clientes
- [x] Busca e filtro
- [x] Status (ativo/inativo)
- [x] Limite de crédito

### 5. Gestão de Empréstimos
- [x] Lista de empréstimos
- [x] Status (pago/ativo/pendente)
- [x] Criação com simulação
- [x] Cálculo de juros (sistema price)

### 6. Cobranças
- [x] Parcelas atrasadas
- [x] Vencimentos do dia
- [x] Integração WhatsApp
- [x] Estatísticas de recuperação

### 7. Configurações
- [x] Perfil do usuário
- [x] Notificações
- [x] Segurança (senha)

---

## ✅ Funcionalidades Concluídas (v1.1 - Fases 1-5)

### Fase 1: Regras de Negócio (Juros e Parcelamento)
- [x] **Juros por faixa de parcelas**
  - Configurar percentual por número de parcelas
  - Ex: 1-5x = 50%, 6-10x = 80%
- [x] **Tipo de juros** (mensal ou semanal)
- [x] **Multa por atraso** (percentual fixo configurável)
- [x] **Juros por atraso** (percentual diário ou mensal)
- [x] **CRUD completo** de configurações
- [x] **Validação**: não permitir sobreposição de faixas
- [x] **Aplicação automática** ao criar empréstimo
- [x] **Imutabilidade**: alterações não afetam contratos existentes
- **Tabelas**: `interest_rules`, `late_fee_config`, `loan_config`
- **Router**: `businessRules.ts`

### Fase 2: Gestão de Funcionários (Permissões)
- [x] **Perfis de acesso**
  - Administrador
  - Gerente
  - Operador
  - Visualizador
- [x] **Permissões por módulo**
  - Dashboard: visualizar/editar
  - Clientes: visualizar/editar/excluir
  - Empréstimos: visualizar/editar/excluir
  - Cobranças: visualizar/editar
  - Configurações: editar
- [x] **Interface de gestão**
  - Checkbox por aba
  - Associa usuário ao perfil
- [x] **Templates de permissões**
- **Tabelas**: `roles`, `user_roles`, `permission_templates`
- **Router**: `users.ts`

### Fase 3: Painel Adminstrativo (Super Admin)
- [x] **Gestão de empresas (tenants)**
  - Criar/editar/desativar empresas
  - Controle de planos
  - Funcionalidades liberadas por empresa
- [x] **Métricas globais**
  - Taxa de inadimplência por empresa
  - Total de clientes e empréstimos
- [x] **Análise operacional**
  - Uso por funcionários
- [x] **Feature flags** por tenant
- **Router**: `superAdmin.ts`

### Fase 4: Notificações Avançadas
- [x] **Sistema de notificações**
  - Visual (no sistema)
  - E-mail
  - Ambos
- [x] **Configurações por usuário**
  - Escolher tipos de notificação
  - Escolher eventos
  - Horários de modo descanso (quiet hours)
- [x] **Feature flags** por empresa
- **Tabelas**: `user_notification_settings`, `tenant_features`
- **Router**: `notifications.ts`

### Fase 5: Templates de Mensagem
- [x] **Templates do sistema**
- [x] **Templates personalizados**
- [x] **Regras por score do cliente**
- [x] **Fallback para padrão do sistema**
- [x] **Preview de variáveis**
- **Tabela**: `message_templates`
- **Router**: `templates.ts`

---

## 🎯 MVP - Funcionalidades Pendentes (Fases 6-13)

### Fase 6: Mensagens por Cliente
- [ ] **Mensagem sugerida** baseada na situação
- [ ] **Envio direto** (WhatsApp)
- [ ] **Validação de telefone**
  - Sugerir cadastro se não houver

### Fase 7: Status e Prioridade
- [ ] **Status automático**
  - Em dia
  - Atrasado
  - Inadimplente
- [ ] **Prioridade de recebimento**
  - Baseado em valor e tempo

### Fase 8: Limite de Crédito
- [ ] **Definição manual**
- [ ] **Regras automáticas**
  - % do caixa por cliente
  - Limite total emprestado

### Fase 9: Numeração de Contratos
- [ ] **Modelo por cliente**
- [ ] **Modelo por empresa**
- [ ] **Modelo global**

### Fase 10: Logs e Auditoria
- [ ] **Registro de ações**
  - Quem fez
  - O que fez
  - Quando fez
- [ ] **Análise por funcionário**
- [ ] **Histórico completo**

### Fase 11: Geração de PDF
- [ ] **Extrato por cliente**
  - Histórico completo
  - Total devido
  - Pagamentos realizados
- [ ] **Extrato por empréstimo**
  - Dados do cliente
  - Parcelas
  - Quem deu baixa
- [ ] **Auditoria no PDF**
  - Quem gerou
  - Data de geração

### Fase 12: Modo Venda Rápida
- [ ] **Criação rápida**
  - Selecionar cliente
  - Inserir valor
- [ ] **Estruturação correta** dos dados

### Fase 13: Alertas Inteligentes
- [ ] **Alertas de crédito**
  - Parcela vencida
  - Parcela vencendo
  - Cliente inadimplente
  - Cliente próximo do limite
- [ ] **Alertas operacionais**
  - Pagamento registrado
  - Empréstimo criado
- [ ] **Alertas estratégicos**
  - Aumento de inadimplência
  - Queda de recebimentos

---

## 📋 Resumo - O que falta para o MVP

| Fase | Funcionalidade | Status |
|------|---------------|--------|
| 1 | Regras de Negócio (Juros) | ✅ |
| 2 | Gestão de Funcionários | ✅ |
| 3 | Painel Super Admin | ✅ |
| 4 | Notificações Avançadas | ✅ |
| 5 | Templates de Mensagem | ✅ |
| 6 | Mensagens por Cliente | ❌ |
| 7 | Status e Prioridade | ❌ |
| 8 | Limite de Crédito | ❌ |
| 9 | Numeração de Contratos | ❌ |
| 10 | Logs e Auditoria | ❌ |
| 11 | Geração de PDF | ❌ |
| 12 | Modo Venda Rápida | ❌ |
| 13 | Alertas Inteligentes | ❌ |

**Total: 8 fases faltando para completar o MVP completo**

---

## 🎯 Próximas Prioridades

1. **Fase 6 - Mensagens por Cliente**: Interface para envio direto de mensagens via WhatsApp
2. **Fase 7 - Status e Prioridade**: Status automático e cálculo de prioridade
3. **Fase 8 - Limite de Crédito**: Regras automáticas de limite
4. **Fase 11 - Geração de PDF**: Extratos e contratos

---

*Última atualização: 2026-03-18*
