# TODO - AXION Cred - Pendências de Desenvolvimento

## Visão Geral
Este documento lista todas as funcionalidades que requerem implementação de backend (API/banco de dados) para funcionamento completo do frontend já desenvolvido.

---

## 🔴 Prioridade Alta - Funcionalidades Core

### 1. Relatórios Financeiros Avançados
**Local:** `/reports/financial`
**Status Frontend:** ✅ Completo
**Pendências Backend:**
- [ ] Endpoint para dados de fluxo de caixa (receita, despesas, lucro por período)
- [ ] Endpoint para projeção de fluxo de caixa (baseado em parcelas a receber)
- [ ] Endpoint para relatório de inadimplência por período
- [ ] Endpoint para dados de performance da equipe de cobrança
- [ ] Criar índices no PostgreSQL para consultas analíticas em `loans` e `installments`

### 2. Gestão de Fiadores/Garantias
**Local:** `/guarantors`
**Status Frontend:** ✅ Completo
**Pendências Backend:**
- [ ] Tabela `guarantors` (id, customer_id, name, document, phone, email, address, type, relation, status)
- [ ] Tabela `guarantees` (id, loan_id, guarantor_id, type, description, value, status, document_number)
- [ ] CRUD completo para fiadores
- [ ] CRUD completo para garantias
- [ ] Endpoint para vincular fiador/garantia a empréstimo
- [ ] Validação de documentos (CPF/CNPJ)

### 3. Fluxo de Renegociação de Dívidas
**Local:** `/renegotiations`
**Status Frontend:** ✅ Completo
**Pendências Backend:**
- [ ] Tabela `renegotiations` (id, original_loan_id, new_loan_id, original_value, current_debt, new_value, new_installments, new_interest, status, requested_by, requested_at, completed_at, notes)
- [ ] Criar novo contrato automaticamente ao aprobar renegociação
- [ ] Manter histórico do empréstimo original
- [ ] Endpoint para aprovar/reprovar renegociação
- [ ] Enviar notificação ao cliente sobre status da renegociação

### 4. Barra de Pesquisa Global
**Local:** Header do dashboard
**Status Frontend:** ✅ Completo (UI)
**Pendências Backend:**
- [ ] Endpoint de busca unificada que pesquise:
  - [ ] Clientes (nome, CPF, telefone, email)
  - [ ] Empréstimos (número do contrato, cliente)
  - [ ] Parcelas (número, status, data)
  - [ ] Funcionários (nome, cargo)
- [ ] Implementar busca com relevância/ranking
- [ ] Limitar resultados e permitir paginação

### 5. Notificações em Tempo Real
**Local:** Dropdown de notificações no header
**Status Frontend:** ✅ Completo (UI)
**Pendências Backend:**
- [ ] Configurar Supabase Realtime ou WebSockets
- [ ] Tabela `notifications` (id, user_id, type, title, message, read, created_at)
- [ ] Triggers no banco para gerar notificações automaticamente:
  - [ ] Pagamento registrado
  - [ ] Parcela vencendo (X dias antes)
  - [ ] Parcela atrasada
  - [ ] Novo empréstimo criado
  - [ ] Renegociação solicitada
- [ ] Endpoint para marcar como lida
- [ ] Endpoint para listar notificações do usuário

---

## 🟡 Prioridade Média - Funcionalidades de Melhoria

### 6. Logs de Ação Detalhados (Auditoria Avançada)
**Local:** `/settings/audit-logs`
**Status Frontend:** Parcial (página existe)
**Pendências Backend:**
- [ ] Tabela `audit_logs` (id, user_id, entity_type, entity_id, action, old_values, new_values, ip_address, user_agent, created_at)
- [ ] Criar função trigger para auditoria automática em tabelas principais
- [ ] Endpoint para visualizar histórico de alterações por entidade

### 7. Rate Limiting e Proteção
**Status Frontend:** N/A
**Pendências Backend:**
- [ ] Implementar rate limiting por IP (ex: 100 req/min)
- [ ] Implementar rate limiting por usuário autenticado
- [ ] Configurar em endpoints críticos (/api/trpc/*)
- [ ] Adicionar proteção CSRF
- [ ] Headers de segurança (XSS protection, HSTS, etc)

### 8. Cache com Redis
**Status Frontend:** N/A
**Pendências Backend:**
- [ ] Configurar Redis para cache
- [ ] Cachear listagens frequentes (customers, loans)
- [ ] Cachear regras de juros
- [ ] Cachear sessões de usuário
- [ ] Implementar invalidação de cache apropriada

### 9. Otimização de Queries e Índices
**Status Frontend:** N/A
**Pendências Backend:**
- [ ] Analisar consultas mais frequentes
- [ ] Adicionar índices em:
  - [ ] `customers.document`
  - [ ] `customers.name`
  - [ ] `loans.customer_id`
  - [ ] `loans.status`
  - [ ] `installments.loan_id`
  - [ ] `installments.status`
  - [ ] `installments.due_date`
- [ ] Implementar paginação eficiente
- [ ] Considerar particionamento de tabelas grandes

---

## 🟢 Prioridade Baixa - Funcionalidades Avançadas

### 10. Arquitetura de Micro-frontends
**Status Frontend:** Conceitual
**Pendências:**
- [ ] Avaliar se necessário para escala
- [ ] Separar módulos se necessário:
  - Módulo de Clientes
  - Módulo de Empréstimos
  - Módulo de Relatórios

### 11. Roteiro de Cobrança Automatizado
**Local:** `/collections`
**Status Frontend:** Parcial
**Pendências Backend:**
- [ ] Tabela `collection_schedules` (id, loan_id, day_offset, channel, template)
- [ ] Sistema de filas para enviar lembretes automaticamente
- [ ] Integração com WhatsApp/E-mail paraenvio de mensagens
- [ ] Templates de mensagem configuráveis

### 12. Histórico de Interações
**Local:** `/customers/[id]/messages`
**Status Frontend:** Parcial
**Pendências Backend:**
- [ ] Tabela `interactions` (id, customer_id, type, direction, content, notes, user_id, created_at)
- [ ] CRUD para registrar interações
- [ ] Timeline de interações por cliente

### 13. Segmentação de Clientes
**Status Frontend:** N/A
**Pendências Backend:**
- [ ] Tabela `customer_segments` (id, name, criteria)
- [ ] Sistema de tags dinâmicas
- [ ] Classificação automática:
  - [ ] Alto risco
  - [ ] Bons pagadores
  - [ ] Em renegociação

### 14. Testes Automatizados
**Status Frontend:** N/A
**Pendências Backend:**
- [ ] Configurar Jest para testes unitários
- [ ] Configurar Cypress/Playwright para testes E2E
- [ ] Criar testes para endpoints críticos
- [ ] Criar fluxos de teste E2E (login, criar cliente, criar empréstimo)

### 15. Monitoramento e Alertas
**Status Frontend:** N/A
**Pendências Backend:**
- [ ] Configurar Sentry para captura de erros
- [ ] Configurar Datadog para métricas
- [ ] Criar alertas para:
  - [ ] Taxa de erro > 5%
  - [ ] Tempo de resposta > 2s
  - [ ] Inadimplência > 20%

### 16. Multi-idioma (i18n)
**Frontend:** Implementado (i18n já existe)
**Pendências Backend:**
- [ ] Endpoint para detectar idioma do navegador
- [ ] Suporte a Espanhol e Inglês
- [ ] Dados em múltiplos idiomas (se necessário)

---

## 📋 Checklist de Verificação

### Antes de Considerar Completo:
- [ ] Todos os endpoints REST/GraphQL implementados
- [ ] Tipos TypeScript sincronizados com API
- [ ] Tratamento de erros adequado
- [ ] Loading states funcionais
- [ ] Testes unitários passando
- [ ] Documentação de API atualizada

---

## 🔗 Recursos Necessários

### Variáveis de Ambiente:
```
# Redis (para cache)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### Dependências Backend:
- Redis
- Biblioteca de rate limiting (ex: express-rate-limit)
- Biblioteca de análise de queries (pg-stat-monitor)

---

## 📅 Estimativas

| Funcionalidade | Complexidade | Estimativa |
|----------------|--------------|------------|
| Relatórios Financeiros | Alta | 2-3 sprints |
| Fiadores/Garantias | Média | 1-2 sprints |
| Renegociação | Alta | 2 sprints |
| Busca Global | Média | 1 sprint |
| Notificações Realtime | Alta | 2 sprints |
| Logs de Auditoria | Média | 1 sprint |
| Rate Limiting | Baixa | 0.5 sprints |
| Cache Redis | Média | 1 sprint |
| Otimização Queries | Contínua | - |

---

*Última atualização: 2026-03-20*
*Responsável: Frontend Team*
