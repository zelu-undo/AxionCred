# AXION Cred - TODO: Funcionalidades Frontend e Backend

## 🎨 MELHORIAS FRONTEND IMPLEMENTADAS

### ✅ Completed (Esta sessão)
1. **Busca Global Funcional**
   - Implementada busca no Header com atalho ⌘K
   - Redireciona para página de clientes com query search
   - Suporte a teclado (Esc para sair)

2. **EmptyState Melhorado**
   - Animações mais suaves com Framer Motion
   - Design visual mais premium
   - Botões com hover effects

3. **Correção de Bugs**
   - Corrigido bug de estrutura na página de Settings

---

## 🚧 FUNCIONALIDADES QUE PRECISAM IMPLEMENTAÇÃO BACKEND

### 1. Relatórios Financeiros

#### Fluxo de Caixa Projetado
- **Frontend:** ✅ Layout e componentes prontos em `/reports/financial`
- **Backend:** ❌ Necesário implementar:
  - Endpoint para calcular parcelas futuras
  - Query que soma principal + juros por data de vencimento
  - Lógica de projeção baseada em histórico de pagamentos

#### Relatório de Inadimplência por Período
- **Frontend:** ✅ Layout pronto com gráficos e tabelas
- **Backend:** ❌ Necesário implementar:
  - Query que agrupa parcelas atrasadas por período (7, 15, 30, 60, 90+ dias)
  - Cálculo de taxa de inadimplência
  - Dados reais conectados

#### Relatório de Performance da Equipe
- **Frontend:** ✅ Layout pronto com métricas
- **Backend:** ❌ Necesário implementar:
  - Query de cobradores com métricas
  - Total de contatos realizados
  - Valor recuperado por cobrador
  - Comparação com meta

---

### 2. Gestão de Fiadores/Garantias

#### Cadastro de Fiadores
- **Frontend:** ✅ Página `/guarantors` criada
- **Backend:** ❌ Necesário implementar:
  - Tabela `guarantors` no banco
  - CRUD de fiadores (create, list, update, delete)
  - Endpoint para vincular fiador a empréstimo

#### Tipos de Garantia
- **Frontend:** ✅ Formulário com tipos (imóvel, veículo, pessoal)
- **Backend:** ❌ Necesário implementar:
  - Tabela `guarantees` com tipos
  - Upload de documentos (se necessário)
  - Validação de garantias

---

### 3. Renegociação de Dívidas

#### Processo de Renegociação
- **Frontend:** ✅ Página `/renegotiations` com formulário
- **Backend:** ❌ Necesário implementar:
  - Tabela `renegotiations` 
  - Endpoint para criar renegocição
  - Lógica para gerar novo contrato com novas condições
  - Manter histórico do empréstimo original
  - Status (pendente, aprovado, rejeitado)

#### Workflow de Aprovação
- **Frontend:** ⚠️ Precisa melhorar
- **Backend:** ❌ Necesário implementar:
  - Aprovação/rejeição de renegociação
  - Notificação de status

---

### 4. Barra de Pesquisa Global

#### Busca em Múltiplas Entidades
- **Frontend:** ✅ Implementada busca básica
- **Backend:** ❌ Necesário implementar:
  - Endpoint de busca unificada (`/api/search`)
  - Busca em: customers, loans, installments, staff
  - Retorno formatado com tipo de resultado

#### Melhorias Frontend
- **Frontend:** ❌ Necesário implementar:
  - Dropdown com resultados em tempo real
  - Navegação direta ao clicar no resultado

---

### 5. Notificações em Tempo Real

#### Sistema de Notificações
- **Frontend:** ⚠️ UI básica implementada no Header
- **Backend:** ❌ Necesário implementar:
  - Supabase Realtime ou WebSocket
  - Tabela de notificações
  - Eventos: payment_received, installment_overdue, new_loan

#### Tipos de Notificação
- Pagamento recebido
- Parcela vencendo
- Novo empréstimo criado
- Alerta de inadimplência

---

### 6. Auditoria Avançada (Logs de Ação)

#### Histórico de Alterações
- **Frontend:** ⚠️ Página básica `/settings/audit-logs`
- **Backend:** ❌ Necesário implementar:
  - Tabela `audit_logs`
  - Middleware/hook para registrar ações
  - Dados: usuário, ação, entidade, valores antigo/novo, timestamp
  - Filtros por entidade, usuário, data

---

### 7. Recursos Backend Adicionais

#### Rate Limiting
- Implementar limite de requisições por IP
- Limite por usuário autenticado
- Endpoints críticos: login, criação de cliente, criação de empréstimo

#### Cache com Redis (Opcional)
- Cache de listagens frequentes
- Cache de regras de juros
- Sessões de usuário

#### Otimização de Queries
- Revisar índices nas tabelas:
  - `loans` (customer_id, status, created_at)
  - `installments` (loan_id, status, due_date)
  - `customers` (document, created_at)
- Query de listagem com paginação

---

### 8. Testes Automatizados

#### Testes Unitários (Jest)
- Testes de componentes React
- Testes de utilitários (formatação, validação)

#### Testes E2E (Playwright/Cypress)
- Fluxo de login
- Criação de cliente
- Criação de empréstimo
- Registro de pagamento

---

### 9. Monitoramento

#### Ferramentas Sugeridas
- **Sentry:** Captura de erros
- **Datadog:** Métricas de performance (precisa DD_API_KEY)

---

## 📋 PRIORIDADES DE IMPLEMENTAÇÃO

### Alta Prioridade
1. Busca global completa (backend + frontend dropdown)
2. Relatórios financeiros com dados reais
3. Notificações em tempo real

### Média Prioridade
4. Gestão de fiadores completa
5. Renegociação de dívidas
6. Auditoria avançada

### Baixa Prioridade
7. Rate limiting
8. Cache Redis
9. Testes automatizados
10. Monitoramento (Sentry/Datadog)

---

## 🔗 ENDPOINTS NECESSÁRIOS

```typescript
// Search
GET /api/search?q=termo&type=customer|loan|installment|staff

// Reports
GET /api/reports/cash-flow?startDate=&endDate=
GET /api/reports/default-rate?startDate=&endDate=
GET /api/reports/team-performance?startDate=&endDate=

// Guarantors
POST /api/guarantors
GET /api/guarantors
GET /api/guarantors/:id
PUT /api/guarantors/:id
DELETE /api/guarantors/:id

// Renegotiations
POST /api/renegotiations
GET /api/renegotiations
GET /api/renegotiations/:id
PUT /api/renegotiations/:id/approve
PUT /api/renegotiations/:id/reject

// Audit
GET /api/audit-logs?entity=&userId=&startDate=&endDate=

// Notifications (WebSocket/Supabase Realtime)
- Subscribe to: notifications:{userId}
```

---

## 📱 RESPONSIVIDADE

O frontend já está responsivo, mas testar:
- Mobile: sidebar hamburger menu
- Tablet: grids de 2 colunas
- Desktop: grids de 3-4 colunas

---

*Última atualização: 2026-03-20*
*Responsável: Frontend Team*
