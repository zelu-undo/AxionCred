# AXION - A Infraestrutura Global de Crédito e Confiança Digital

## 1. OBJECTIVE

**Visão Estratégica:**
AXION não é apenas um sistema de gestão de empréstimos. É uma plataforma de infraestrutura de crédito que conecta credores, devedores, dados e meios de pagamento em uma única camada de confiança. Começamos resolvendo as dores de pequenos comerciantes, autônomos e pessoas físicas que concedem crédito informal. Mas nossa arquitetura foi projetada para escalar globalmente, tornando-se o padrão de mercado para qualquer operação de crédito – desde o fiado da mercearia até a carteira de uma fintech.

**Objetivo Principal:** Projetar a arquitetura completa de um SaaS de gestão de crédito, empréstimos e cobrança que evolua de um micro-SaaS para uma plataforma dominante no segmento, posicionamento como "A camada de infraestrutura de crédito e confiança digital".

**Pilares de Evolução:**
- Rede de Dados Compartilhados (Opt-in) – Um grafo de confiança global onde, com consentimento, históricos financeiros anonimizados melhoram decisões de crédito.
- Infraestrutura de Pagamentos Integrada – Intermediação do fluxo financeiro com geração de links de pagamento (Pix, boleto, cartão) e conciliação automática.
- Motor de Decisão Automatizado – Recomendação em tempo real de valor, taxa e parcelas baseada em scores e comportamento.

**Valores da Marca:**
- Autoridade. Controle. Tecnologia. Confiança.

**Escopo Técnico:** Sistema multi-tenant (tenants), múltiplos usuários por tenant, permissões granulares, documentos, histórico completo, score de crédito global compartilhado (opt-in), motor de decisões, gateway de pagamentos, API pública futura.


## 2. CONTEXT SUMMARY

### 2.1 Visão do Produto
A AXION é uma plataforma de infraestrutura de crédito destinada a:
- **Público primário:** Pequenos comerciantes de bairro (mercados, lojas de roupas, mecânicas) que trabalham com "fiado" ou carnês
- **Público secundário:** Pessoas físicas que emprestam dinheiro com juros, profissionais autônomos que parcelam serviços
- **Público futuro:** Empresas de cobrança, fintechs, e qualquer operação de crédito

### 2.2 Stack Tecnológico (Atualizado)
| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Frontend | Next.js (App Router), Tailwind, shadcn/ui, React Query, PWA | Performance, SEO, offline-first, experiência consistente |
| Backend | Node.js + tRPC | Type-safety total, comunicação eficiente, base para API pública |
| Banco de Dados | Supabase (PostgreSQL) com extensões (pgcrypto, pg_trgm) | Escalabilidade, segurança, backup automático |
| Cache e Filas | Redis (Upstash) | Rate limiting, cache de consultas, filas para jobs assíncronos |
| Jobs Agendados | Vercel Edge Functions / Inngest | Lembretes, recálculo de score, atualização de status |
| Observabilidade | Sentry, Logtail, Prometheus + Grafana | Monitoramento profissional |
| Eventos | EventEmitter interno + Redis Pub/Sub | Arquitetura orientada a eventos |

### 2.3 Arquitetura do Sistema
```
[Cliente Web / PWA]
       ↓
[CDN / Vercel Edge]
       ↓
[Next.js (App Router) + tRPC Client]
       ↓
[API Layer (Node.js + tRPC Server)]
       ↓
[Camada de Serviços (Domínios: Customers, Loans, Payments, Credit Network, Decisions)]
       ↓
[Repositórios / Acesso a Dados]
       ↓
[PostgreSQL (Supabase) + Redis (Upstash)]
       ↓
[Storage (Supabase / S3)]
       ↓
[Integrações Externas: WhatsApp API, Gateways de Pagamento, E-mail/SMS]
```

### 2.4 Modelo de Negócio (Planos)
| Plano | Preço | Limites |
|-------|-------|---------|
| Starter | R$19/mês | Até 50 clientes, controle de parcelas, cobrança manual, comprovante PDF |
| Professional | R$39/mês | Clientes ilimitados, relatórios básicos, WhatsApp API, módulo fiado, lembretes automáticos |
| Business | R$99-399/mês | Múltiplos usuários, automação avançada, relatórios completos, gateway de pagamentos, suporte prioritário |
| Enterprise | Custom | White label, API ilimitada, Marketplace de integrações |

### 2.5 Entidades Principais do Sistema

#### Tenancy
- `tenants` - Empresas/negócios cadastrados (com configurações de gateway)
- `tenant_settings` - Configurações específicas por tenant

#### Usuários e Permissões
- `users` - Usuários do sistema (ligados a um tenant)
- `roles` - Papéis (owner, admin, manager, operator)
- `permissions` - Permissões por página/recurso
- `user_permissions` - Permissões específicas por usuário

#### Gestão de Clientes
- `customers` - Cadastro com global_identity_id (opcional)
- `customer_documents` - Documentos uploadados por categoria
- `customer_events` - Histórico de eventos
- `consent_logs` - Registros de consentimento (opt-in global)

#### Gestão de Empréstimos
- `loans` - Registros de empréstimos
- `loan_installments` - Parcelas do empréstimo
- `credit_decisions` - Decisões do motor de recomendação
- `payment_proofs` - Comprovantes de pagamento

#### Infraestrutura de Pagamentos
- `payment_transactions` - Transações (Pix, boleto, cartão, cash)
- `payment_gateway_config` - Configurações de gateway por tenant

#### Sistema de Crédito Global
- `global_identities` - Identidades anônimas (hash de CPF)
- `global_credit_profiles` - Perfis agregados (score consolidado)
- `credit_score_history` - Histórico de scores

#### Cobrança e Automação
- `reminder_settings` - Configurações de lembretes automáticos
- `reminder_logs` - Log de lembretes enviados
- `whatsapp_messages` - Mensagens enviadas via WhatsApp

#### Sistema de Limites
- `credit_limits` - Limites de crédito por cliente

#### Auditoria e Notificações
- `audit_logs` - Logs de ações dos usuários
- `notifications` - Notificações internas

### 2.6 Fluxo Principal de Dados

```
Cliente → Cadastro (com opt-in global) → Empréstimo → Motor de Decisão → Parcelas → Cobrança → Pagamento → Comprovante → Histórico
              ↓                                    ↓                              ↓
        Identidade Global                   Score + Decisão              Transação (Pix/Boleto)
              ↓                                    ↓                              ↓
        Consentimento                         Cache Redis                  Conciliação Automática
```


## 3. APPROACH OVERVIEW

### 3.1 Arquitetura Geral

O sistema será construído utilizando uma arquitetura **multi-tenant** com tRPC, seguindo os pilares da visão estratégica:

1. **Frontend Moderno com Next.js 14+ (App Router)**
   - React Query para gerenciamento de estado server-state
   - UI Components com Tailwind + shadcn/ui
   - PWA com Service Workers (offline-first)
   - Theme provider para modo claro/escuro
   - Server Components para renderização híbrida

2. **Backend com tRPC (type-safe)**
   - Endpoints type-safe entre frontend e backend
   - Base para API pública futura (mesma camada)
   - Middleware para autenticação e autorização
   - Rate limiting via Redis
   - Validação com Zod

3. **Banco de Dados Relacional (PostgreSQL via Supabase)**
   - Schema multi-tenant com `tenant_id` em todas as tabelas
   - Row Level Security (RLS) para isolamento de dados
   - Extensões: pgcrypto (hash), pg_trgm (busca), timescaledb (séries temporais)
   - Triggers para audit trail e atualização de status
   - Índices otimizados para consultas frequentes

4. **Camada de Cache e Filas (Redis/Upstash)**
   - Rate limiting
   - Cache de consultas frequentes
   - Filas BullMQ para jobs assíncronos
   - Pub/Sub para eventos em tempo real

5. **Autenticação e Autorização**
   - Supabase Auth com JWT
   - Roles e permissões customizadas por tenant
   - Sessões persistentes com refresh token

### 3.2 Decisões de Design

| Decisão | Justificativa |
|---------|---------------|
| tRPC desde o início | Type-safety total, base sólida para API pública |
| Multitenancy desde o início | Escala futura + não requer migração |
| CPF hasheado para identidade global | Privacidade, LGPD compliance |
| Opt-in para compartilhamento global | Consentimento explícito, conformidade legal |
| WhatsApp link manual no MVP | Reduces friction, valida necessidade antes de API |
| Score global agregado | Efeito de rede + lock-in natural |
| Motor de decisão pré-arquitetado | Escala para fases futuras |
| Payment transactions layer | Base para gateway unificado |

### 3.3 Camadas de Domínio (Clean Architecture)

```
src/
├── domain/                    # Entidades e regras de negócio
│   ├── customers/
│   ├── loans/
│   ├── payments/
│   ├── credit-network/
│   └── decisions/
├── application/               # Casos de uso
│   ├── use-cases/
│   └── services/
├── infrastructure/            # Implementações externas
│   ├── database/
│   ├── cache/
│   ├── queue/
│   └── integrations/
└── api/                      # Camada tRPC
    ├── routers/
    └── middleware/
```

### 3.4 Padrões de Código

- **Clean Architecture** com separação de concerns
- **tRPC** para comunicação type-safe
- **Repository Pattern** para acesso a dados
- **EventEmitter** para arquitetura orientada a eventos
- **DTOs** com Zod para validação
- **TypeScript** strict mode em todo o codebase

### 3.5 Desafios Técnicos Identificados

| Problema | Solução na Arquitetura |
|----------|----------------------|
| Compartilhamento global exige privacidade e anonimização | CPF nunca em texto plano; usamos hash com salt. Dados compartilhados são sempre agregados. Consentimento obrigatório e registrado. |
| Integração com múltiplos gateways de pagamento | Camada de abstração com adaptadores (Pix, boleto, cartão). Cada transação guarda external_id e status normalizado. |
| Motor de decisão precisa ser rápido e escalável | Decisões podem ser pré-calculadas em cache Redis. Algoritmo plugável (regras configuráveis + ML futuro). |
| Eventos e consistência eventual | Filas BullMQ para processar eventos assíncronos. Transações atômicas + eventos após commit. |
| Segurança de dados sensíveis | Criptografia em repouso para CPF e documentos. Hash para identificadores globais. Logs de auditoria. |
| Escalabilidade das consultas globais | Tabela global atualizada periodicamente (não real-time) para evitar contenção. Particionamento por range de hash. |
| Rate limiting e proteção contra abusos | Redis para limitar chamadas à API pública e privada. |
| Conformidade LGPD/GDPR | Funcionalidade de "esquecimento" (anonymize) que remove referências pessoais, mantendo apenas dados agregados anônimos. |


## 4. IMPLEMENTATION STEPS

### FASE 1: Infraestrutura e Configuração (Semanas 1-2)

#### Step 1.1: Setup do Projeto Next.js
- **Goal:** Criar projeto base com TypeScript, ESLint, Prettier
- **Method:**
  - Inicializar projeto Next.js 14+ com App Router
  - Configurar TypeScript strict mode
  - Configurar ESLint com regras de qualidade
  - Configurar estrutura de pastas (clean architecture)
- **Reference:** `package.json`, `next.config.js`, `tsconfig.json`

#### Step 1.2: Configuração do Supabase
- **Goal:** Criar projeto Supabase e configurar banco de dados
- **Method:**
  - Criar projeto no Supabase
  - Configurar variáveis de ambiente
  - Habilitar autenticação por email/senha
  - Configurar Storage buckets para documentos
- **Reference:** `.env.local`, Supabase Dashboard

#### Step 1.3: Schema do Banco de Dados (v1)
- **Goal:** Criar tabelas base para multiempresa e usuários
- **Method:** Executar script SQL para criar schema inicial
- **Reference:** `supabase/schema.sql`

```sql
-- Tabelas principais (schema completo na seção 5)
```

#### Step 1.4: Autenticação e Autorização Base
- **Goal:** Sistema de login e proteção de rotas
- **Method:**
  - Configurar Supabase Auth Provider
  - Criar middleware de autenticação
  - Implementar Login page
  - Configurar JWT custom claims para roles
- **Reference:** `app/(auth)/login/page.tsx`, `middleware.ts`

---

### FASE 2: Gestão de Clientes (Semanas 2-3)

#### Step 2.1: Cadastro de Clientes
- **Goal:** CRUD completo de clientes com validações
- **Method:**
  - Criar tabela `customers` no banco
  - API: `GET/POST /api/customers`
  - API: `GET/PUT/DELETE /api/customers/:id`
  - Formulário com validação Zod
  - Máscara para CPF e telefone
- **Reference:** `app/customers/page.tsx`, `app/api/customers/route.ts`

#### Step 2.2: Pesquisa de Clientes
- **Goal:** Busca rápida por nome, CPF, telefone
- **Method:**
  - Implementar busca com ILIKE no PostgreSQL
  - Criar índice para performance
  - Debounce na busca em tempo real
  - Limitar campos editáveis (apenas histórico e observações)
- **Reference:** `components/customer-search.tsx`

#### Step 2.3: Histórico do Cliente
- **Goal:** Registro completo de eventos
- **Method:**
  - Tabela `customer_events` para histórico
  - Tipos: EMPRESTIMO, PAGAMENTO, ATRASO, RENEGOCIACAO, ANOTACAO
  - Timeline visual no frontend
  - ordenação cronológica
- **Reference:** `components/customer-timeline.tsx`

#### Step 2.4: Documentos do Cliente
- **Goal:** Upload e gestão de documentos por categoria
- **Method:**
  - Tabela `customer_documents`
  - Categorias: COMPROVANTE, DOCUMENTO_FRENTE, DOCUMENTO_VERSO, OUTROS
  - Storage Supabase para arquivos
  - Funcionários veem apenas o mais recente
  - Owner vê tudo e pode excluir
  - Limite de 5MB por arquivo
- **Reference:** `app/customers/[id]/documents/page.tsx`

---

### FASE 3: Gestão de Empréstimos (Semanas 3-4)

#### Step 3.1: Registro de Empréstimos
- **Goal:** Criar empréstimo com cálculo automático de parcelas
- **Method:**
  - Tabela `loans` com campos: valor, taxa_juros, tipo_juros, num_parcelas, data_primeira_parcela
  - Tipos de juros: MENSAL_PERCENTUAL, FIXO_POR_PARCELA, TOTAL_FIXO
  - Cálculo automático na criação
  - Geração automática de parcelas
- **Reference:** `app/loans/new/page.tsx`, `lib/calculations.ts`

#### Step 3.2: Cálculos de Juros
- **Goal:** Engine de cálculos preciso para diferentes cenários
- **Method:**
  - Implementar funções de cálculo:
    - Juros simples: `valor * (taxa/100) * meses`
    - Parcelas fixas: amortização PRICE/SAC
  - Precisão decimal (2 casas)
  - Validação de entrada
  - Preview antes de confirmar
- **Reference:** `lib/loan-calculator.ts`

**Fórmulas de Cálculo:**
```typescript
// Parcela fixa (Sistema Price)
const parcela = valor * (taxa * Math.pow(1 + taxa, parcelas)) / (Math.pow(1 + taxa, parcelas) - 1)

// Juros simples total
const jurosTotal = valor * (taxa / 100) * parcelas
const total = valor + jurosTotal
```

#### Step 3.3: Controle de Parcelas
- **Goal:** Gestão de status e pagamentos
- **Method:**
  - Status: A_PAGAR, PAGA, ATRASADA, CANCELADA
  - Marcar como paga com um clique
  - Registro de data de pagamento
  - Atualização automática de status (A_PAGAR → ATRASADA)
  - Cron job para verificar atrasos diário
- **Reference:** `app/loans/[id]/page.tsx`

#### Step 3.4: Cadastro Retroativo
- **Goal:** Permitir inserir dados de empréstimos passados
- **Method:**
  - Campo data_original na tabela loans
  - Status de parcelas calculados 基于 data_original
  - Histórico registra data real do evento
- **Reference:** `app/loans/new/page.tsx` (mode retroativo)

---

### FASE 4: Dashboard e Relatórios (Semanas 4-5)

#### Step 4.1: Dashboard Principal
- **Goal:** Visão geral do negócio
- **Method:**
  - KPIs principais:
    - Total emprestado (soma de todos os loans)
    - Total a receber (soma parcelas pendentes)
    - Parcelas atrasadas (count + valor)
    - Parcelas do dia (vencem hoje)
  - Atualização em tempo real via Supabase Realtime
- **Reference:** `app/dashboard/page.tsx`

#### Step 4.2: Dashboard Avançado
- **Goal:** Gráficos e indicadores profundos
- **Method:**
  - Gráficos com Recharts ou Tremor:
    - Evolução de receita (últimos 12 meses)
    - Taxa de inadimplência por período
    - Top 10 clientes devedores
    - Distribuição por status
  - Indicadores:
    - Taxa de inadimplência = (atrasadas / total) * 100
    - Ticket médio por empréstimo
    - Taxa de recuperação
- **Reference:** `app/dashboard/advanced/page.tsx`

#### Step 4.3: Previsão de Caixa
- **Goal:** Projeção de recebimentos futuros
- **Method:**
  - Calcular basedo em parcelas futuras
  - Extrapolação com taxa de inadimplência
  - Visualização semanal/mensal
- **Reference:** `app/dashboard/cashflow/page.tsx`

---

### FASE 5: Sistema de Cobrança (Semanas 5-6)

#### Step 5.1: WhatsApp Link (MVP)
- **Goal:** Cobrança manual via WhatsApp
- **Method:**
  - Gerar link: `https://wa.me/55{ddd}{telefone}?text={mensagem}`
  - Mensagem customizável com template
  - Variáveis: {nome}, {valor}, {data_vencimento}, {parcela}
  - Abrir em nova aba
- **Reference:** `components/whatsapp-button.tsx`

**Template padrão:**
```
Olá {nome}, tudo bem?

Sua parcela de R${valor} ({parcela}/{total}) venceu no dia {data_vencimento}.

Pode regularizar o pagamento quando puder. Estamos à disposição!

Att, {empresa}
```

#### Step 5.2: Comprovante de Pagamento (PDF)
- **Goal:** Gerar e compartilhar comprovante
- **Method:**
  - Usar jsPDF ou @react-pdf/renderer
  - Dados: empresa, cliente, valor, data, parcela, assinatura digital
  - Upload para Storage e link para compartilhamento
  - Botão WhatsApp para enviar
- **Reference:** `components/payment-proof.tsx`, `app/proofs/[id]/page.tsx`

#### Step 5.3: Automação de Cobrança (Futuro)
- **Goal:** Lembretes automáticos via API
- **Method:**
  - Integração com Z-API ou Evolution API
  - Configurações por empresa:
    - Dias antes do vencimento
    - No dia do vencimento
    - Dias após atraso (1, 3, 7, 15, 30)
  - Limite de mensagens por plano
  - Log de mensagens enviadas
- **Reference:** `app/settings/reminders/page.tsx`

---

### FASE 6: Sistema de Permissões (Semanas 6-7)

#### Step 6.1: Multiusuário
- **Goal:** Múltiplos usuários por empresa
- **Method:**
  - Tabela `company_members`
  - Convites por email
  - Funções: OWNER, ADMIN, MANAGER, OPERATOR
  - Limite por plano
- **Reference:** `app/settings/team/page.tsx`

#### Step 6.2: Permissões Granulares
- **Goal:** Controle de acesso por página/recurso
- **Method:**
  - Tabela `permissions`:
    - Recurso (clientes, loans, relatórios, configurações)
    - Ação (view, create, edit, delete)
  - Níveis: SEM_ACESSO, LEITURA, EDICAO
  - Verificação em middleware e componentes
  - Owner tem acesso total
- **Reference:** `lib/permissions.ts`, `middleware.ts`

**Matriz de Permissões:**
| Recurso | Owner | Admin | Manager | Operator |
|---------|-------|-------|---------|----------|
| Clientes | CRUD | CRUD | CRUD | CR + View |
| Empréstimos | CRUD | CRUD | CRU | CR |
| Parcelas | CRUD | CRUD | CRU | CRU |
| Relatórios | CRUD | CRUD | View | View |
| Configurações | CRUD | CRUD | View | - |
| Equipe | CRUD | CRUD | - | - |

---

### FASE 7: Sistema de Crédito (Semanas 7-8)

#### Step 7.1: Score Interno
- **Goal:** Classificação do cliente baseada em histórico
- **Method:**
  - Score de 0-1000
  - Fatores:
    - Pagamentos em dia (+pontos)
    - Atrasos (-pontos)
    - Tempo como cliente (+pontos)
    - Valor total emprestado
  - Classificações: A (800+), B (600-799), C (400-599), D (<400)
- **Reference:** `lib/credit-score.ts`

**Cálculo do Score:**
```typescript
// Algoritmo base
let score = 500 // base
score += pagamentosPerfeitos * 20
score -= diasAtrasados * 2
score += Math.min(tempoMeses * 5, 100) // max 100
score = Math.max(0, Math.min(1000, score))
```

#### Step 7.2: Score Compartilhado por CPF
- **Goal:** Agregar histórico entre diferentes empresas
- **Method:**
  - Tabela `credit_scores` separada por CPF
  - Apenas score agregado compartilhado
  - Não expõe detalhes de empréstimos
  - Atualização nightly via cron
- **Reference:** `app/customers/[id]/score/page.tsx`

#### Step 7.3: Indicadores Visuais de Risco
- **Goal:** Alertas visuais no sistema
- **Method:**
  - Cores por classificação:
    - A: Verde
    - B: Amarelo
    - C: Laranja
    - D: Vermelho
  - Badges nos cards de cliente
  - Alertas na tela de empréstimo
  - Filtros por risco
- **Reference:** `components/risk-indicator.tsx`

---

### FASE 8: Módulos Avançados (Semanas 8-10)

#### Step 8.1: Módulo Fiado
- **Goal:** Consulta rápida no ponto de venda
- **Method:**
  - Tela simplificada mobile-first
  - Busca por nome/telefone
  - Exibe: parcelas abertas, atrasos, score, resumo histórico
  - Decisão: Aprovar/Negar nova venda
- **Reference:** `app/pos/page.tsx`

#### Step 8.2: Renegociação
- **Goal:** Recalcular dívida e criar novo plano
- **Method:**
  - Wizard de renegociação
  - Opções: quitar, parcelar, estender
  - Criar novo loan com referência ao original
  - Histórico registra evento
  - Juros de mora configuráveis
- **Reference:** `app/loans/[id]/renegotiate/page.tsx`

#### Step 8.3: Sistema de Notificações Internas
- **Goal:** Alertas no sistema
- **Method:**
  - Tabela `notifications`
  - Tipos: PARCELA_VENCIDA, PARCELA_HOJE, CLIENTE_NOVO, etc.
  - Marcar como lida
  - Badge no header
  - Dropdown de notificações
- **Reference:** `components/notifications.tsx`

#### Step 8.4: Logs de Auditoria
- **Goal:** Registrar todas as ações dos usuários
- **Method:**
  - Tabela `audit_logs`
  - Campos: user_id, action, table_name, record_id, old_value, new_value, timestamp
  - Apenas Owner e Admin podem acessar
  - Pesquisa e filtros
- **Reference:** `app/settings/audit/page.tsx`

---

### FASE 9: UI/UX e Polish (Semanas 10-12)

#### Step 9.1: Modo Claro/Escuro
- **Goal:** Alternância de tema
- **Method:**
  - Next-themes para tema
  - Persistência no localStorage
  - System preference detection
  - Transições suaves
- **Reference:** `app/layout.tsx`, `components/theme-toggle.tsx`

#### Step 9.2: Branding AXION
- **Goal:** Transmitir autoridade e tecnologia
- **Method:**
  - Cores profissionais:
    - Primária: Azul escuro (#0F172A)
    - Secundária: Roxo (#7C3AED)
    - Alertas: Vermelho (#DC2626), Verde (#16A34A)
  - Tipografia: Inter ou similar
  - Componentes consistentes
  - Animações sutis
- **Reference:** `app/globals.css`, `tailwind.config.ts`

#### Step 9.3: Responsividade
- **Goal:** Funcionar em todos os dispositivos
- **Method:**
  - Mobile-first design
  - Breakpoints: sm (640px), md (768px), lg (1024px)
  - Sidebar colapsável em mobile
  - Telas touch-friendly
- **Reference:** Todas as páginas

---

### FASE 10: Preparação para Produção (Semanas 12-14)

#### Step 10.1: Testes
- **Goal:** Garantir qualidade
- **Method:**
  - Unit tests para cálculos (Jest/Vitest)
  - Integration tests (Playwright)
  - Testes E2E de fluxos principais
- **Reference:** `tests/` directory

#### Step 10.2: Performance
- **Goal:** Sistema rápido
- **Method:**
  - Otimizar queries (índices, paginação)
  - Lazy loading de componentes
  - Image optimization
  - Code splitting
- **Reference:** `next.config.js`

#### Step 10.3: SEO e Metadata
- **Goal:** Discoverabilidade
- **Method:**
  - Meta tags dinâmicas
  - Sitemap.xml
  - Robots.txt
  - Open Graph tags
- **Reference:** `app/layout.tsx`

#### Step 10.4: Deploy
- **Goal:** Sistema no ar
- **Method:**
  - Deploy na Vercel
  - Configurar environment variables
  - Configurar build command
  - Health check endpoint
- **Reference:** Vercel Dashboard

---

## 5. TESTING AND VALIDATION

### 5.1 Database Schema (Schema Completo)

O schema a seguir cobre todas as funcionalidades do sistema:

```sql
-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE loan_status AS ENUM ('PENDING', 'ACTIVE', 'PAID_OFF', 'CANCELLED', 'RENEGOTIATED');
CREATE TYPE installment_status AS ENUM ('PENDING', 'PAID', 'LATE', 'CANCELLED');
CREATE TYPE interest_type AS ENUM ('MONTHLY_PERCENT', 'FIXED_PER_INSTALLMENT', 'FIXED_TOTAL');
CREATE TYPE document_category AS ENUM ('PROOF', 'DOCUMENT_FRONT', 'DOCUMENT_BACK', 'OTHER');
CREATE TYPE event_type AS ENUM ('LOAN_CREATED', 'LOAN_UPDATED', 'LOAN_CANCELLED', 'PAYMENT', 'LATE_FEE', 'RENEGOTIATION', 'NOTE');
CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'OPERATOR');
CREATE TYPE permission_level AS ENUM ('NONE', 'READ', 'WRITE', 'DELETE');
CREATE TYPE reminder_type AS ENUM ('BEFORE_DUE', 'ON_DUE', 'AFTER_DUE');
CREATE TYPE customer_classification AS ENUM ('A', 'B', 'C', 'D');

-- ============================================
-- COMPANIES (Multi-tenant)
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    document VARCHAR(20), -- CNPJ ou CPF
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    logo_url TEXT,
    plan VARCHAR(50) DEFAULT 'basic', -- basic, professional, enterprise
    max_customers INTEGER DEFAULT 50,
    max_users INTEGER DEFAULT 1,
    max_whatsapp_messages INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS (Extended from Supabase Auth)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'OPERATOR',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TENANTS (Updated - replacing companies)
-- ============================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'starter',
    settings JSONB NOT NULL DEFAULT '{}',
    payment_gateway_config JSONB, -- configurações de gateway por tenant
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- USERS (Extended from Supabase Auth) - Updated tenant_id
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'OPERATOR',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CUSTOMERS - Updated with global_identity_id and consent
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    global_identity_id UUID, -- opcional, referência à identidade global
    name TEXT NOT NULL,
    phone TEXT,
    cpf TEXT,
    email TEXT,
    address JSONB,
    observations TEXT,
    credit_score INTEGER DEFAULT 500,
    risk_level TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN credit_score >= 800 THEN 'A'
            WHEN credit_score >= 600 THEN 'B'
            WHEN credit_score >= 400 THEN 'C'
            ELSE 'D'
        END
    ) STORED,
    metadata JSONB,
    consent_global_share BOOLEAN DEFAULT false, -- opt-in para compartilhamento
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, cpf)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_cpf ON customers(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_global_identity ON customers(global_identity_id);

-- ============================================
-- CUSTOMER DOCUMENTS
-- ============================================
CREATE TABLE customer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    category document_category NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CUSTOMER EVENTS (History)
-- ============================================
CREATE TABLE customer_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    loan_id UUID, -- pode ser null para anotações
    event_type event_type NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_events_customer ON customer_events(customer_id);

-- ============================================
-- CONSENT LOGS (Opt-in Global)
-- ============================================
CREATE TABLE consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- 'global_share'
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ, -- se aplicável
    ip_address INET
);

-- ============================================
-- GLOBAL IDENTITIES (Anonymous)
-- ============================================
CREATE TABLE global_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf_hash TEXT UNIQUE NOT NULL, -- hash criptografado
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_global_identities_cpf_hash ON global_identities(cpf_hash);

-- ============================================
-- GLOBAL CREDIT PROFILES (Aggregated)
-- ============================================
CREATE TABLE global_credit_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    global_identity_id UUID REFERENCES global_identities(id) ON DELETE CASCADE,
    aggregated_score INTEGER, -- score consolidado (0-1000)
    total_loans INTEGER DEFAULT 0,
    total_paid DECIMAL(14,2) DEFAULT 0,
    default_rate DECIMAL(5,2) DEFAULT 0, -- percentual de inadimplência
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CREDIT SCORE HISTORY
-- ============================================
CREATE TABLE credit_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    reason TEXT,
    calculated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CREDIT LIMITS
-- ============================================
CREATE TABLE credit_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    max_amount DECIMAL(12,2) NOT NULL,
    current_used DECIMAL(12,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, customer_id)
);

-- ============================================
-- LOANS
-- ============================================
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    original_loan_id UUID REFERENCES loans(id), -- para renegociação
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(10,4), -- pode ser null para juros zero
    interest_type interest_type DEFAULT 'MONTHLY_PERCENT',
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) NOT NULL,
    num_installments INTEGER NOT NULL,
    paid_installments INTEGER DEFAULT 0,
    first_due_date DATE NOT NULL,
    original_date DATE, -- para cadastro retroativo
    status loan_status DEFAULT 'PENDING',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_loans_tenant ON loans(tenant_id);
CREATE INDEX idx_loans_customer ON loans(customer_id);
CREATE INDEX idx_loans_status ON loans(status);

-- ============================================
-- LOAN INSTALLMENTS
-- ============================================
CREATE TABLE loan_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    interest_amount DECIMAL(15,2) DEFAULT 0,
    principal_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    paid_date DATE,
    status installment_status DEFAULT 'PENDING',
    late_fee DECIMAL(15,2) DEFAULT 0,
    paid_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_installments_loan ON loan_installments(loan_id);
CREATE INDEX idx_installments_status ON loan_installments(status);
CREATE INDEX idx_installments_due_date ON loan_installments(due_date);

-- ============================================
-- CREDIT DECISIONS (Motor de Decisão)
-- ============================================
CREATE TABLE credit_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    requested_amount DECIMAL(12,2), -- opcional, se o cliente solicitou um valor
    recommended_amount DECIMAL(12,2),
    recommended_interest DECIMAL(6,3),
    recommended_installments INTEGER,
    risk_score INTEGER, -- score na hora da decisão
    decision TEXT NOT NULL, -- 'approved', 'review', 'denied'
    factors JSONB, -- principais fatores que influenciaram
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id) -- quem solicitou a decisão (pode ser automático)
);

-- ============================================
-- PAYMENT TRANSACTIONS (Payment Layer)
-- ============================================
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES loan_installments(id) ON DELETE SET NULL,
    external_id TEXT, -- ID no gateway (ex: Pix copia e cola)
    amount DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed', 'refunded'
    method TEXT NOT NULL, -- 'pix', 'boleto', 'card', 'cash'
    paid_at TIMESTAMPTZ,
    gateway_response JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payment_transactions_installment ON payment_transactions(installment_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- ============================================
-- PAYMENT PROOFS
-- ============================================
CREATE TABLE payment_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_id UUID REFERENCES loan_installments(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    pdf_url TEXT,
    sent_via_whatsapp BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- REMINDER SETTINGS
-- ============================================
CREATE TABLE reminder_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    days_offset INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT true,
    message_template TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- REMINDER LOGS
-- ============================================
CREATE TABLE reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES loan_installments(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    message_sent TEXT,
    status TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- WHATSAPP MESSAGES
-- ============================================
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'manual',
    status TEXT DEFAULT 'pending',
    whatsapp_response JSONB,
    sent_by UUID REFERENCES users(id),
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function para atualizar status de parcelas (verificar atrasos)
CREATE OR REPLACE FUNCTION check_installments_status()
RETURNS void AS $$
BEGIN
    UPDATE loan_installments
    SET status = 'LATE'
    WHERE status = 'PENDING'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function para atualizar loan remaining_amount
CREATE OR REPLACE FUNCTION update_loan_totals()
RETURNS TRIGGER AS $$
DECLARE
    paid DECIMAL(15,2);
    remaining DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(paid_amount), 0), 
           COALESCE(SUM(amount), 0) - COALESCE(SUM(paid_amount), 0)
    INTO paid, remaining
    FROM loan_installments
    WHERE loan_id = NEW.loan_id;
    
    UPDATE loans
    SET paid_amount = paid,
        remaining_amount = remaining,
        paid_installments = (SELECT COUNT(*) FROM loan_installments WHERE loan_id = NEW.loan_id AND status = 'PAID')
    WHERE id = NEW.loan_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loan_after_installment
    AFTER INSERT OR UPDATE ON loan_installments
    FOR EACH ROW EXECUTE FUNCTION update_loan_totals();

-- Function para hash de CPF
CREATE OR REPLACE FUNCTION hash_cpf(cpf TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(cpf || 'axion_salt_2024', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## 6. SUGESTÕES DE MELHORIAS E NOVAS FUNCIONALIDADES

Além das funcionalidades já definidas, as seguintes melhorias foram estruturadas para evolução do produto:

### 6.1 Sistema de Limites de Crédito por Cliente
- **Descrição:** Definir limite máximo que cada cliente pode ter em empréstimos simultâneos
- **Benefício:** Controle de risco proativo, evita superendividamento do cliente
- **Implementação:** Campo `credit_limit` na tabela customers, validação na criação de novos empréstimos

### 6.2 Alertas Inteligentes Baseados em Comportamento
- **Descrição:** Algoritmo que detecta padrões de atraso e envia alertas proativos
- **Exemplos:**
  - Cliente que historicamente atrasa 5 dias
  - Cliente que está reduzindo valor das parcelas
  - Cliente com múltiplos empréstimos ativos
- **Implementação:** Cron job noturno que analiza padrões e cria notificações

### 6.3 Ranking de Clientes (Melhores e Piores Pagadores)
- **Descrição:** Lista ordenada de clientes por comportamento de pagamento
- **Classificações:**
  - 🏆 TOP: Clientes com 100% de pontualidade
  - ✅ BOM: Poucos atrasos
  - ⚠️ ATENÇÃO: Atrasos frequentes
  - 🔴 RISCO: Múltiplos atrasos ou inadimplência
- **Implementação:** Query agregada com order by score

### 6.4 API Pública Futura (para Integrações)
- **Descrição:** Expor endpoints REST para integração com ERPs, CRMs, e outros sistemas
- **Endpoints sugeridos:**
  - `GET /api/v1/customers` - Listar clientes
  - `POST /api/v1/loans` - Criar empréstimo
  - `GET /api/v1/installments` - Listar parcelas
  - `POST /api/v1/payments` - Registrar pagamento
- **Autenticação:** API Keys por empresa com rate limiting
- **Documentação:** OpenAPI/Swagger

### 6.5 Sistema de Planos e Limites Avançados
- **Descrição:** Enforcement de limites via banco + aplicação
- **Limites por plano:**
  | Recurso | Básico | Profisional | Empresas |
  |---------|--------|--------------|----------|
  | Clientes | 50 | Ilimitado | Ilimitado |
  | Usuários | 1 | 5 | 20 |
  | WhatsApp/mês | 0 | 500 | 5000 |
  | APIs | ✗ | ✗ | ✓ |
  | Módulo Fiado | ✗ | ✓ | ✓ |

### 6.6 Módulo de Relatórios Exportáveis
- **Descrição:** Relatórios avançados para exportação
- **Formatos:** PDF, Excel, CSV
- **Relatórios:**
  - Extrato do cliente
  - Receita por período
  - Inadimplência por faixa
  - Projeção de recebimentos

### 6.7 Sistema de Cashback/Recompensas (Futuro)
- **Descrição:** Sistema de pontos para clientes que pagam em dia
- **Benefício:** Fidelização, estímulo a pontualidade
- **Implementação:** Pontos acumuláveis, conversão em desconto

### 6.8 Integração com Sistemas de Pagamento
- **Descrição:** Aceitar pagamentos via PIX, cartão, boleto
- **Benefício:** Facilitar quitação, aumentar taxa de recuperação
- **Integrações:** Mercado Pago, PagSeguro, Stripe

---

## 7. BRANDING E POSICIONAMENTO

### 7.1 Identidade Visual
O sistema deve transmitir os valores abaixo através do design:

| Valor | Como Refletir no Design |
|-------|------------------------|
| **Autoridade** | Layout profissional, tipografia sóbria, cores conservadoras |
| **Controle** | Dashboard com métricas claras, indicadores visuais |
| **Tecnologia** | Animações suaves, feedback instantâneo, design moderno |
| **Análise de Risco** | Scores visuais, alertas claros, gráficos informativos |
| **Confiança** | Comprovantes profissionais, histórico completo, segurança |
| **Seriedade** | Cores sóbrias, linguagem formal, funcionalidades completas |

### 7.2 Paleta de Cores Recomendada
```
--primary: #0F172A (Azul escuro - autoridade)
--primary-light: #334155 (Azul cinza - sutileza)
--accent: #7C3AED (Roxo - tecnologia)
--success: #16A34A (Verde - pagamento em dia)
--warning: #D97706 (Amarelo - atenção)
--danger: #DC2626 (Vermelho - risco/atraso)
--background: #F8FAFC (Claro) / #0F172A (Escuro)
--surface: #FFFFFF (Claro) / #1E293B (Escuro)
```

### 7.3 Nome e Posicionamento
- **Nome:** AXION Cred
- **Tagline:** "Controle total do seu crédito"
- **Posicionamento:** O sistema de gestão de crédito para quem leva inadimplência a sério

---

## 8. PRÓXIMOS PASSOS

1. **Iniciar desenvolvimento do MVP** seguindo a Fase 1-5 do plano
2. **Validar com usuários reais** (pequenos comerciantes)
3. **Iterar baseado em feedback** antes de expandir funcionalidades
4. **Implementar sistema de pagamento** quando houver demanda

---

*Plano elaborado considerando escalabilidade, experiência do usuário e viabilidade técnica.*


-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies (exemplo para customers)
CREATE POLICY "Company can manage own customers" ON customers
    FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para loans updated_at
CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function para atualizar status de parcelas (verificar atrasos)
CREATE OR REPLACE FUNCTION check_installments_status()
RETURNS void AS $$
BEGIN
    UPDATE loan_installments
    SET status = 'LATE'
    WHERE status = 'PENDING'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function para atualizar loan remaining_amount
CREATE OR REPLACE FUNCTION update_loan_totals()
RETURNS TRIGGER AS $$
DECLARE
    paid DECIMAL(15,2);
    remaining DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(paid_amount), 0), 
           COALESCE(SUM(amount), 0) - COALESCE(SUM(paid_amount), 0)
    INTO paid, remaining
    FROM loan_installments
    WHERE loan_id = NEW.loan_id;
    
    UPDATE loans
    SET paid_amount = paid,
        remaining_amount = remaining,
        paid_installments = (SELECT COUNT(*) FROM loan_installments WHERE loan_id = NEW.loan_id AND status = 'PAID')
    WHERE id = NEW.loan_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loan_after_installment
    AFTER INSERT OR UPDATE ON loan_installments
    FOR EACH ROW EXECUTE FUNCTION update_loan_totals();
```

### 5.2 Critérios de Validação

#### Funcionalidades MVP (Validação)
| Funcionalidade | Critério de Sucesso |
|----------------|---------------------|
| Cadastro de clientes | Cliente salvo com todos os campos, aparece na lista |
| Registro de empréstimo | Parcelas geradas corretamente com cálculos |
| Status de parcelas | Atualiza para "Atrasada" automaticamente |
| Dashboard | KPIs atualizados em tempo real |
| WhatsApp link | Link correto com mensagem formatada |
| Comprovante PDF | PDF gerado e baixável |

#### Funcionalidades Avançadas (Validação)
| Funcionalidade | Critério de Sucesso |
|----------------|---------------------|
| Multiusuário | Usuários conseguem fazer login e ver apenas dados da empresa |
| Permissões | Operador não consegue acessar configurações |
| Histórico | Todos os eventos aparecem na timeline |
| Score | Score calculado corretamente baseado em pagamentos |
| Renegociação | Novo plano criado com referência ao original |
| Módulo Fiada | Consulta rápida retorna dados corretos |

#### Testes de Integração
```bash
# Fluxo principal: Cliente → Empréstimo → Pagamento
1. Criar cliente
2. Criar empréstimo com 3 parcelas
3. Verificar 3 parcelas geradas
4. Marcar 1ª parcela como paga
5. Verificar status atualizado no loan
6. Gerar comprovante PDF
7. Verificar no dashboard: total a receber atualizado
```

#### Testes de Performance
- Busca de cliente: < 200ms
- Dashboard load: < 1s
- Geração de PDF: < 3s
- API responses: < 500ms (p95)

### 5.3 Lista de Verificação para Deploy

- [ ] Todos os testes passando
- [ ] Variáveis de ambiente configuradas
- [ ] SSL/HTTPS habilitado
- [ ] RLS policies ativas
- [ ] Índices criados
- [ ] Limites de plano implementados
- [ ] Rate limiting configurado
- [ ] Logs de erro configurados (Sentry)
- [ ] Backup do banco configurado
- [ ] Health check respondendo
- [ ] 404 e Error pages customizadas
