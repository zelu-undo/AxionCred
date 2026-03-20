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
- [x] **Mensagem sugerida** baseada na situação (frontend)
- [x] **Envio direto** (WhatsApp) (frontend)
- [x] **Validação de telefone** (frontend)
  - Sugerir cadastro se não houver

### Fase 7: Status e Prioridade
- [x] **Status automático** (frontend)
  - Em dia
  - Atrasado
  - Inadimplente
- [x] **Prioridade de recebimento** (frontend)
  - Baseado em valor e tempo

### Fase 8: Limite de Crédito
- [x] **Definição manual** (frontend)
- [x] **Regras automáticas** (frontend)
  - % do caixa por cliente
  - Limite total emprestado

### Fase 9: Numeração de Contratos
- [x] **Modelo por cliente** (frontend)
- [x] **Modelo por empresa** (frontend)
- [x] **Modelo global** (frontend)

### Fase 10: Logs e Auditoria
- [x] **Registro de ações** (frontend)
  - Quem fez
  - O que fez
  - Quando fez
- [x] **Análise por funcionário** (frontend)
- [x] **Histórico completo** (frontend)

### Fase 11: Geração de PDF
- [x] **Extrato por cliente** (frontend)
  - Histórico completo
  - Total devido
  - Pagamentos realizados
- [x] **Extrato por empréstimo** (frontend)
  - Dados do cliente
  - Parcelas
  - Quem deu baixa
- [x] **Auditoria no PDF** (frontend)
  - Quem gerou
  - Data de geração

### Fase 12: Modo Venda Rápida
- [x] **Criação rápida** (frontend)
  - Selecionar cliente
  - Inserir valor
- [x] **Estruturação correta** dos dados (frontend)

### Fase 13: Alertas Inteligentes
- [x] **Alertas de crédito** (frontend)
  - Parcela vencida
  - Parcela vencendo
  - Cliente inadimplente
  - Cliente próximo do limite
- [x] **Alertas operacionais** (frontend)
  - Pagamento registrado
  - Empréstimo criado
- [x] **Alertas estratégicos** (frontend)
  - Aumento de inadimplência
  - Queda de recebimentos

---

## ✅ Novas Funcionalidades (v1.2 - 2026-03)

### Financial Reports (`/reports/financial`)
- [x] Dashboard de fluxo de caixa (receita, despesas, lucro)
- [x] Projeção de fluxo de caixa baseada em parcelas a receber
- [x] Relatório de inadimplência por período
- [x] Relatório de performance da equipe de cobrança

### Fiadores e Garantias (`/guarantors`)
- [x] Gestão de fiadores (pessoa física/jurídica)
- [x] Cadastro de garantias (imóvel, veículo, fiador)
- [x] Vinculação de garantias a empréstimos
- [x] Status: ativo, inativo, verificado, pendente

### Renegociação de Dívidas (`/renegotiations`)
- [x] Criação de renegociação com novas condições
- [x] Histórico do empréstimo original
- [x] Workflow de aprovação/rejeição
- [x] Simulação de novas parcelas

### Busca Global
- [x] Campo de busca no header
- [x] Atalho Cmd+K

### Notificações em Tempo Real
- [x] UI de notificações no header
- [x] Tipos: pagamento, vencimento, alerta

---

## 📋 Resumo - O que falta para o MVP

| Fase | Funcionalidade | Frontend | Backend |
|------|---------------|----------|---------|
| 1 | Regras de Negócio (Juros) | ✅ | ✅ |
| 2 | Gestão de Funcionários | ✅ | ✅ |
| 3 | Painel Super Admin | ✅ | ✅ |
| 4 | Notificações Avançadas | ✅ | ✅ |
| 5 | Templates de Mensagem | ✅ | ✅ |
| 6 | Mensagens por Cliente | ✅ | ❌ |
| 7 | Status e Prioridade | ✅ | ❌ |
| 8 | Limite de Crédito | ✅ | ❌ |
| 9 | Numeração de Contratos | ✅ | ❌ |
| 10 | Logs e Auditoria | ✅ | ❌ |
| 11 | Geração de PDF | ✅ | ❌ |
| 12 | Modo Venda Rápida | ✅ | ❌ |
| 13 | Alertas Inteligentes | ✅ | ❌ |
| N/A | Relatórios Financeiros | ✅ | ❌ |
| N/A | Fiadores e Garantias | ✅ | ❌ |
| N/A | Renegociação de Dívidas | ✅ | ❌ |
| N/A | Busca Global | ✅ | ❌ |
| N/A | Notificações Realtime | ✅ | ❌ |

**Frontend: ✅ Completo (todas as fases + novas funcionalidades)**
**Backend: ❌ Faltando implementação**

---

## 🎯 Próximas Prioridades (Backend)

1. **Fase 6 - Mensagens por Cliente**: API para envio de mensagens via WhatsApp
2. **Fase 7 - Status e Prioridade**: Cálculo automático de status e prioridade
3. **Fase 8 - Limite de Crédito**: Regras automáticas e API de limites
4. **Fase 11 - Geração de PDF**: Geração real de PDF no backend

---

## ✅ Frontend Completo

Todas as 13 fases do MVP possuem interface frontend implementada:

| Fase | Página | Localização |
|------|--------|-------------|
| 6 | Mensagens por Cliente | `/customers/[id]/messages` |
| 7 | Status e Prioridade | `/customers/status` |
| 8 | Limite de Crédito | `/settings/credit-limit` |
| 9 | Numeração de Contratos | `/settings/contract-numbering` |
| 10 | Logs e Auditoria | `/settings/audit-logs` |
| 11 | Geração de PDF | `/reports` |
| 12 | Venda Rápida | `/quick-sale` |
| 13 | Alertas Inteligentes | `/alerts` |

---

## 📋 Nova Versão - v1.2 Features (Março 2026)

| Funcionalidade | Página | Status |
|----------------|--------|--------|
| Relatórios Financeiros | `/reports/financial` | ✅ Frontend |
| Fiadores e Garantias | `/guarantors` | ✅ Frontend |
| Renegociação de Dívidas | `/renegotiations` | ✅ Frontend |
| Busca Global | Header | ✅ Frontend |
| Notificações Realtime | Header | ✅ Frontend |

**Frontend: ✅ Completo**
**Backend: ❌ Necessário implementar APIs e banco**

---

*Última atualização: 2026-03-20*
