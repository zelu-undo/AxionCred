# AXION Cred - Product Design Document (PDD)

## 📋 Histórico de Versões

| Versão | Data | Autor | Descrição |
|--------|------|-------|------------|
| 1.0 | 2026-04-07 | OpenHands AI | Documento inicial completo |

---

# 1. Visão Geral do Produto

## 1.1 Introdução

Este documento apresenta o **Product Design Document (PDD)** completo do sistema AXION Cred, uma plataforma SaaS de gestão de crédito para pequenos negócios. Aqui está documentado todo o estado atual do sistema, incluindo funcionalidades implementadas, arquitetura técnica, estrutura de dados, e o planejamento para desenvolvimentos futuros.

## 1.2 Definição do Produto

**AXION Cred** é uma plataforma de gestão de crédito e cobranças专为 pequenos empresário que precisam de uma solução simples e eficiente para gerenciar seus clientes, empréstimos, e cobranças de forma integrada.

### Problema que Resolve

- Falta de controle sobre clientes inadimplentes
- Dificuldade no cálculo de juros e parcelas
- Processo manual de cobranças
- Ausência de métricas e relatórios
- Dificuldade em gerenciar equipe de vendas

### Solução Oferecida

Plataforma completa com:
- Cadastro e gestão de clientes com histórico completo
- Sistema de empréstimos com cálculo automático de juros
- Automação de cobranças e notificações
- Relatórios financeiros e analytics
- Gestão de equipe com permissões

## 1.3 Objetivos do Produto

### Objetivos Estratégicos
1. **Tornar-se referência** em gestão de crédito para pequenos negócios no Brasil
2. **Reduzir inadimplência** dos clientes em pelo menos 30%
3. **Aumentar eficiência** operacional em 50%
4. **Facilitar tomada de decisão** com dados em tempo real

### Objetivos de Produto
- Proporcionar interface intuitiva e rápida
- Automatizar processos repetitivos
- Fornecer insights acionáveis
- Garantir segurança dos dados
- Integrar com ferramentas do dia a dia

## 1.4 Proposta de Valor

| Para quem | Problema | Solução AXION |
|-----------|----------|---------------|
| Pequenos empresário | Controle manual de crédito | Sistema automatizado |
| Gerente de crédito | Calcular juros e parcelas | Cálculo automático |
| Equipe de cobrança | Sem ferramenta de acompanhamento | Dashboard de cobranças |
| Dono do negócio | Sem métricas | Relatórios em tempo real |

## 1.5 Público-Alvo

- **Público Primário**: Pequenos empresário, freelancers, microempreendedores
- **Público Secundário**: Cooperativas de crédito, financeiras regionais
- **Perfil**: 25-55 anos, conhecimento técnico moderado, foco em resultados

---

# 2. Arquitetura Técnica

## 2.1 Stack Tecnológico

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14 (App Router) | Framework principal |
| React | 18+ | Biblioteca de UI |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 3.x | Estilização |
| shadcn/ui | Latest | Componentes base |
| React Query | 5.x | Gerenciamento de estado servidor |
| Framer Motion | 11.x | Animações |

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 20.x | Runtime |
| tRPC | 11.x | API type-safe |
| Supabase | Latest | Backend-as-a-Service |
| PostgreSQL | 15.x | Banco de dados |

### Infraestrutura
| Serviço | Uso |
|---------|-----|
| Vercel | Deploy frontend |
| Supabase | Database, Auth, Storage, Realtime |

## 2.2 Arquitetura de Aplicação

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  Pages/Routes (App Router)  →  Components  →  Hooks/Lib   │
│  (Auth Context)              (shadcn/ui)      (tRPC Client) │
└─────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMUNICAÇÃO (tRPC)                        │
│            Type-safe API entre frontend e backend           │
└─────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Supabase)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ PostgreSQL  │  │   Auth      │  │    Realtime         │ │
│  │  (Database) │  │(Supabase)   │  │   (WebSockets)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    RLS      │  │  Storage    │  │    Edge Functions   │ │
│  │(Segurança)  │  │  (Arquivos) │  │   (Serverless)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 2.3 Estrutura de Pastas

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Páginas de autenticação
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Páginas autenticadas
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── loans/
│   │   ├── collections/
│   │   ├── reports/
│   │   ├── guarantors/
│   │   ├── renegotiations/
│   │   ├── settings/
│   │   └── ...
│   └── api/                      # API Routes
│       └── trpc/
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── dashboard/                # Componentes específicos
├── contexts/                     # React Contexts
│   └── auth-context.tsx
├── hooks/                        # Custom hooks
├── lib/                          # Utilitários
├── messages/                     # i18n messages
├── server/
│   ├── db/                       # Schema SQL
│   ├── routers/                  # tRPC routers
│   ├── trpc.ts                  # Config tRPC
│   └── supabase.ts              # Cliente Supabase
├── trpc/                         # tRPC client
└── types/                        # TypeScript interfaces
```

## 2.4 Variáveis de Ambiente

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# Opcional - para funcionalidades avançadas
# REDIS_URL=redis://localhost:6379
# RATE_LIMIT_MAX_REQUESTS=100
# RATE_LIMIT_WINDOW_MS=60000
```

## 2.5 Fluxo de Dados

### Criação de Empréstimo
```
1. Usuário acessa /loans/new
2. Seleciona cliente (via busca)
3. Informa valor e parcelas
4. Sistema busca regras de juros (API)
5. Calcula parcelas (sistema Price)
6. Exibe simulação
7. Usuário confirma → API cria empréstimo
8. Cria parcelas automaticamente
9. Retorna para listagem
```

### Fluxo de Cobrança
```
1. Sistema verifica parcelas vencidas (diário)
2. Gera alertas automaticamente
3. Usuário acessa /collections
4. Vê lista de parcelas atrasadas
5. Clica em "Enviar cobrança"
6. Seleciona template de mensagem
7. Sistema envia via WhatsApp (API)
8. Registra interação no histórico
```

---

# 3. Módulos e Funcionalidades

## 3.1 Módulo de Autenticação

### Funcionalidades Implementadas

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Login com e-mail/senha | ✅ | Autenticação via Supabase Auth |
| Registro de usuário | ✅ | Cadastro com validação |
| Logout | ✅ | Encerramento de sessão |
| Sessão persistente | ✅ | Cookies seguros |
| Proteção de rotas | ✅ | Middleware de verificação |
| Demo mode | ✅ | Acesso sem autenticação |

### Fluxo de Autenticação

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Usuário │────▶│  Login   │────▶│ Supabase │
│          │     │   Page   │     │   Auth   │
└──────────┘     └──────────┘     └──────────┘
                                           │
                                           ▼
                                    ┌──────────┐
                                    │ Sessão  │
                                    │ Criada   │
                                    └──────────┘
                                           │
                   ┌───────────────────────┼───────────────────────┐
                   ▼                       ▼                       ▼
            ┌──────────┐            ┌──────────┐            ┌──────────┐
            │  Sucesso │            │  Erro    │            │  Middle  │
            │          │            │          │            │   ware   │
            └──────────┘            └──────────┘            └──────────┘
                   │                       │                       │
                   ▼                       ▼                       ▼
            ┌──────────┐            ┌──────────┐            ┌──────────┐
            │Dashboard │            │  Mostra  │            │ Verifica │
            │          │            │  erro    │            │  sessão  │
            └──────────┘            └──────────┘            └──────────┘
```

### Estados de Usuário

```typescript
interface User {
  id: string
  tenant_id: string
  email: string
  name: string
  role: "owner" | "admin" | "manager" | "operator" | "viewer"
  avatar_url?: string
  is_active: boolean
  last_login?: string
}
```

---

## 3.2 Módulo de Clientes

### Funcionalidades Implementadas

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Lista de clientes | ✅ | Grid com busca e filtros |
| Cadastro de cliente | ✅ | Form com validações |
| Busca por nome/CPF/telefone | ✅ | Busca acelerada |
| Status (ativo/inativo/bloqueado) | ✅ | Controle de status |
| Limite de crédito | ✅ | Definir limite por cliente |
| Endereço completo | ✅ | Integração ViaCEP |
| Documentos | ✅ | Upload de arquivos |
| Histórico de eventos | ✅ | Timeline de interações |
| Messages/WhatsApp | ✅ | Envio de mensagens |
| Status automático | ✅ | Em dia, atrasado, inadimplente |
| Prioridade | ✅ | Classificação automática |
| Scoring | ✅ | Score de crédito |
| Segmentação | ✅ | Tags e classificação |
| LGPD/GDPR | ✅ | Consentimento e controle |

### Validações Implementadas

| Campo | Validação |
|-------|-----------|
| CPF | Algoritmo de dígitos verificadores |
| Telefone | Formato brasileiro com máscara |
| CEP | Busca automática ViaCEP |
| E-mail | Formato válido + uniqueness |

### Estrutura do Cliente

```typescript
interface Customer {
  id: string
  tenant_id: string
  name: string
  email?: string
  phone: string
  document?: string  // CPF ou CNPJ
  address?: Address
  notes?: string
  global_identity_id?: string
  status: "active" | "inactive" | "blocked"
  credit_limit?: number
  created_at: string
  updated_at: string
}

interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}
```

### Páginas do Módulo

| Página | Rota | Descrição |
|--------|------|-----------|
| Lista | `/customers` | Grid de clientes |
| Detalhes | `/customers/[id]` | Dados completos |
| Mensagens | `/customers/[id]/messages` | Histórico de mensagens |
| Status | `/customers/status` | Classificação por status |
| Scoring | `/customers/scoring` | Score de crédito |
| Segmentos | `/customers/segments` | Tags e分類 |

---

## 3.3 Módulo de Empréstimos

### Funcionalidades Implementadas

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Lista de empréstimos | ✅ | Grid com filtros |
| Criação de empréstimo | ✅ | Simulador + criação |
| Cálculo de juros | ✅ | Sistema Price |
| Parcelas automáticas | ✅ | Geração automática |
| Status (pending/active/paid/cancelled/renegotiated) | ✅ | Controle de ciclo |
| Pagamento de parcelas | ✅ | Registro de pagamentos |
| Comprovantes | ✅ | Upload de arquivos |
| Venda rápida | ✅ | Criação simplificada |
| Renegociação | ✅ | Novo contrato com novas condições |

### Sistema de Cálculo de Juros (Sistema Price)

```
Parcela = Principal × [i(1+i)^n] / [(1+i)^n - 1]

Onde:
- i = taxa de juros mensal (decimal)
- n = número de parcelas
```

**Exemplo**:
- Principal: R$ 10.000,00
- Taxa: 5% ao mês (0.05)
- Parcelas: 12

```
Parcela = 10000 × [0.05(1.05)^12] / [(1.05)^12 - 1]
Parcela ≈ R$ 1.206,15
```

### Estrutura do Empréstimo

```typescript
interface Loan {
  id: string
  tenant_id: string
  customer_id: string
  principal_amount: number         // Valor solicitado
  interest_rate: number            // Taxa de juros (decimal)
  total_amount: number            // Total com juros
  paid_amount: number             // Valor já pago
  remaining_amount: number        // Saldo devedor
  installments_count: number      // Total de parcelas
  paid_installments: number        // Parcelas pagas
  status: LoanStatus
  notes?: string
  parent_loan_id?: string          // Para renegociação
  created_at: string
  updated_at: string
}

type LoanStatus = "pending" | "active" | "paid" | "cancelled" | "renegotiated"

interface LoanInstallment {
  id: string
  loan_id: string
  installment_number: number
  amount: number                  // Valor da parcela
  paid_amount?: number            // Valor pago
  due_date: string                // Data de vencimento
  paid_date?: string              // Data de pagamento
  status: InstallmentStatus
  notes?: string
}

type InstallmentStatus = "pending" | "paid" | "late" | "cancelled"
```

### Páginas do Módulo

| Página | Rota | Descrição |
|--------|------|-----------|
| Lista | `/loans` | Grid de empréstimos |
| Novo | `/loans/new` | Criar empréstimo |
| Detalhes | `/loans/[id]` | Dados + parcelas |
| Venda rápida | `/loans/quick` | Criação simplificada |

---

## 3.4 Módulo de Regras de Negócio

### Funcionalidades Implementadas

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Juros por faixa de parcelas | ✅ | % por número de parcelas |
| Tipo de juros (mensal/semanal) | ✅ | Configuração flexível |
| Multa por atraso | ✅ | Percentual fixo |
| Juros por atraso | ✅ | Juros diários/mensais |
| Validação de sobreposição | ✅ | Não permite duplicação |
| Imutabilidade | ✅ | Contratos não afetados |
| CRUD completo | ✅ | Interface completa |

### Configuração de Juros por Parcela

| Faixa de Parcelas | Taxa de Juros |
|--------------------|----------------|
| 1-5x | 50% |
| 6-10x | 80% |
| 11-12x | 100% |
| 13-24x | 120% |
| 25-60x | 150% |

### Estrutura de Regras

```typescript
interface InterestRule {
  id: string
  tenant_id: string
  name: string
  min_installments: number
  max_installments: number
  interest_rate: number        // Decimal (50 = 50%)
  interest_type: "monthly" | "weekly"
}

interface LateFeeConfig {
  id: string
  tenant_id: string
  fee_type: "fixed" | "percentage"
  fee_value: number
  interest_daily?: number       // Juros diários
  interest_monthly?: number     // Juros mensais
  grace_days: number            // Dias de tolerância
}

interface LoanConfig {
  id: string
  tenant_id: string
  default_interest_rate: number
  min_amount: number
  max_amount: number
  min_installments: number
  max_installments: number
}
```

---

## 3.5 Módulo de Cobranças

### Funcionalidades Implementadas

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Lista de parcelas atrasadas | ✅ | Grid de inadimplência |
| Vencimentos do dia | ✅ | Parcelas que vencem hoje |
| Integração WhatsApp | ✅ | Envio de mensagens |
| Templates de mensagem | ✅ | Mensagens personalizáveis |
| Estatísticas de recuperação | ✅ | Métricas de sucesso |
| Alertas inteligentes | ✅ | Notificações automáticas |
| Workflow de cobranças | ✅ | Rotas automatizadas |

### Tipos de Alerta

| Tipo | Gatilho | Descrição |
|------|---------|-----------|
| Parcela vencida | dias_atraso > 0 | Há dias em atraso |
| Vencimento próximo | dias_para_vencer <= 3 | Vence em X dias |
| Cliente inadimplente | parcelas_atrasadas >= 3 | Múltiplas parcelas |

### Páginas do Módulo

| Página | Rota | Descrição |
|--------|------|-----------|
| Cobranças | `/collections` | Grid de parcelas |
| Alertas | `/alerts` | Notificações inteligentes |

---

## 3.6 Módulo de Relatórios

### Funcionalidades Implementadas

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Relatórios financeiros | ✅ | Fluxo de caixa, lucro |
| Projeção de fluxo | ✅ | Baseado em parcelas |
| Inadimplência por período | ✅ | Taxa por mês/ano |
| Performance da equipe | ✅ | Métricas de cobrança |
| Dashboard analítico | ✅ | KPIs e gráficos |
| Fluxo de caixa | ✅ | Entradas e saídas |
| Geração de PDF | ✅ | Extrato cliente/empréstimo |

### Relatórios Disponíveis

| Relatório | Rota | Descrição |
|-----------|------|-----------|
| Relatórios | `/reports` | Menu principal |
| Financeiros | `/reports/financial` | Dados financeiros |
| Fluxo de caixa | `/reports/cash-flow` | Entradas/saídas |
| Analytics | `/reports/analytics` | KPIs e métricas |

### Métricas do Dashboard

| Métrica | Descrição |
|---------|-----------|
| Total de clientes | Clientes ativos |
| Total de empréstimos | Empréstimos ativos |
| Valor total devido | Soma de pendências |
| Taxa de inadimplência | % de atrasados |
| Valor recuperado | Total pagos no período |

---

## 3.7 Módulo de Fiadores e Garantias

### Funcionalidades Implementadas

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Cadastro de fiadores | ✅ | Pessoa física/jurídica |
| Tipos de garantia | ✅ | Imóvel, veículo, pessoal |
| Vinculação a empréstimo | ✅ | Associar fiador ao loan |
| Status (ativo/inativo/verificado/pendente) | ✅ | Controle de verificação |
| Documentação | ✅ | Dados completos |

### Tipos de Garantia

| Tipo | Descrição |
|------|-----------|
| property | Imóvel (casa, apartamento, terreno) |
| vehicle | Veículo (carro, moto, caminhão) |
| personal | Fiador pessoal |
| payroll | Consignado |

### Estrutura

```typescript
interface Guarantor {
  id: string
  tenant_id: string
  name: string
  document: string
  document_type: "cpf" | "cnpj"
  phone: string
  email?: string
  address?: string
  guarantee_type: GuaranteeType
  property_address?: string
  property_type?: string
  property_value?: number
  vehicle_brand?: string
  vehicle_model?: string
  vehicle_year?: string
  vehicle_plate?: string
  vehicle_value?: number
  linked_loan_id?: string
  status: "active" | "inactive" | "verified" | "pending"
  notes?: string
  created_at: string
}
```

### Página do Módulo

| Página | Rota | Descrição |
|--------|------|-----------|
| Fiadores | `/guarantors` | Gestão completa |

---

## 3.8 Módulo de Renegociação

### Funcionalidades Implementadas

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Criar renegociação | ✅ | Novas condições |
| Histórico do original | ✅ | Mantém dados antigos |
| Simulação | ✅ | Calcula novas parcelas |
| Workflow aprovação | ✅ | Aprovar/reprovar |
| Novo contrato | ✅ | Gera novo empréstimo |

### Fluxo de Renegociação

```
1. Cliente solicita renegociação (ou agente sugere)
2. Sistema cria registro de renegociação
3. Calcula novas condições (valor, parcelas, juros)
4. Exibe simulação para aprovação
5. Manager aprova ou reprova
6. Se aprovado: cria novo loan, marca antigo como renegotiated
7. Notifica cliente
```

### Estrutura

```typescript
interface LoanRenegotiation {
  id: string
  tenant_id: string
  loan_id: string
  renegotiation_date: string
  original_total_amount: number
  original_installments_count: number
  new_total_amount: number
  new_installments_count: number
  new_installment_amount: number
  interest_rate?: number
  status: "pending" | "approved" | "rejected" | "cancelled"
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  notes?: string
  created_at: string
}
```

### Página do Módulo

| Página | Rota | Descrição |
|--------|------|-----------|
| Renegociações | `/renegotiations` | Gestão de renegociações |

---

## 3.9 Módulo de Gestão de Equipe

### Funcionalidades Implementadas

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Convite de funcionários | ✅ | Envio de convites |
| Perfis de acesso | ✅ | Admin, Gerente, Operador, Visualizador |
| Permissões por módulo | ✅ | Granular por funcionalidade |
| Templates de permissão | ✅ | Perfis pré-definidos |
| Status de convite | ✅ | Pending, accepted, expired, cancelled |

### Perfis e Permissões

| Perfil | Dashboard | Clientes | Empréstimos | Cobranças | Config |
|--------|-----------|----------|-------------|-----------|--------|
| Owner | ✦ | ✦ | ✦ | ✦ | ✦ |
| Admin | ✦ | ✦ | ✦ | ✦ | ✦ |
| Manager | ✦ | ✦ | ✦ | ✦ | - |
| Operador | ✦ | ✦ | ✦ | ✦ | - |
| Visualizador | ✦ | ✦ | - | - | - |

**✦ = Todas as permissões (visualizar, criar, editar, excluir)**

### Estrutura

```typescript
interface Role {
  id: string
  tenant_id: string
  name: string
  permissions: string[]  // ["dashboard.view", "customers.edit", ...]
}

interface StaffInvite {
  id: string
  tenant_id: string
  email: string
  name: string
  role_id: string
  status: "pending" | "accepted" | "expired" | "cancelled"
  invited_by: string
  created_at: string
}
```

### Páginas do Módulo

| Página | Rota | Descrição |
|--------|------|-----------|
| Staff | `/settings/staff` | Gestão de equipe |
| Funções | `/settings/roles` | Perfis e permissões |

---

## 3.10 Módulo de Configurações

### Funcionalidades Implementadas

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Perfil do usuário | ✅ | Dados e senha |
| Regras de juros | ✅ | Configuração de taxas |
| Notificações | ✅ | Preferências de alerta |
| Templates de mensagem | ✅ | Mensagens personalizadas |
| Limite de crédito | ✅ | Regras de crédito |
| Numeração de contratos | ✅ | Padrão de numeração |
| Logs de auditoria | ✅ | Histórico de ações |
| Workflow de aprovações | ✅ | Aprovação por valor |
| Lembretes | ✅ | Configuração de envios |
| LGPD/GDPR | ✅ | Consentimento e dados |
| Plano | ✅ | Controle de assinatura |

### Páginas de Configuração

| Página | Rota | Descrição |
|--------|------|-----------|
| Configurações | `/settings` | Menu principal |
| Regras de negócio | `/settings/business-rules` | Juros e taxas |
| Equipe | `/settings/staff` | Funcionários |
| Funções | `/settings/roles` | Perfis |
| Limite de crédito | `/settings/credit-limit` | Regras de crédito |
| Numeração | `/settings/contract-numbering` | Padrão de contratos |
| Logs | `/settings/audit-logs` | Histórico |
| Notificações | `/settings/notifications` | Preferências |
| Templates | `/settings/message-templates` | Mensagens |
| Aprovações | `/settings/approvals` | Workflow |
| Lembretes | `/settings/reminders` | Automação |
| LGPD | `/settings/lgpd` | Privacidade |
| Plano | `/settings/plan` | Assinatura |

---

## 3.11 Funcionalidades Globais

### Busca Global
- Campo de busca no header
- Atalho Cmd+K (Mac) / Ctrl+K (Windows)
- Pesquisa em: clientes, empréstimos, parcelas, funcionários

### Notificações em Tempo Real
- Dropdown no header
- Tipos: pagamento, vencimento, alerta
- Supabase Realtime (pendente backend)

### Dashboard
- KPIs principais: clientes, empréstimos, valores
- Dashboard avançado com gráficos
- Lista de últimos empréstimos
- Clientes inadimplentes

---

# 4. Estrutura de Dados

## 4.1 Tabelas Principais

### Tenant (Multi-inquilino)

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    plan VARCHAR(50) DEFAULT 'starter',
    logo_url TEXT,
    settings JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Usuários

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE roles (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100),
    permissions JSONB,
    UNIQUE(tenant_id, name)
);
```

### Clientes

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255),
    name_normalized VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    document VARCHAR(20),
    address TEXT,
    notes TEXT,
    global_identity_id UUID,
    status VARCHAR(20) DEFAULT 'active',
    credit_limit DECIMAL(15,2),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE customer_documents (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    category VARCHAR(100),
    file_url TEXT,
    file_name VARCHAR(255),
    created_at TIMESTAMPTZ
);

CREATE TABLE customer_events (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    type VARCHAR(100),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
);
```

### Empréstimos

```sql
CREATE TABLE loans (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    customer_id UUID REFERENCES customers(id),
    principal_amount DECIMAL(15,2),
    interest_rate DECIMAL(5,2),
    total_amount DECIMAL(15,2),
    paid_amount DECIMAL(15,2),
    remaining_amount DECIMAL(15,2),
    installments_count INTEGER,
    paid_installments INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    parent_loan_id UUID REFERENCES loans(id),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE loan_installments (
    id UUID PRIMARY KEY,
    loan_id UUID REFERENCES loans(id),
    installment_number INTEGER,
    amount DECIMAL(15,2),
    paid_amount DECIMAL(15,2),
    due_date DATE,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE payment_proofs (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    loan_id UUID REFERENCES loans(id),
    installment_id UUID REFERENCES loan_installments(id),
    file_url TEXT,
    file_name VARCHAR(255),
    amount DECIMAL(15,2),
    payment_date DATE,
    created_at TIMESTAMPTZ
);
```

### Regras de Negócio

```sql
CREATE TABLE interest_rules (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100),
    min_installments INTEGER,
    max_installments INTEGER,
    interest_rate DECIMAL(5,2),
    interest_type VARCHAR(20),
    UNIQUE(tenant_id, min_installments, max_installments)
);

CREATE TABLE late_fee_config (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    fixed_fee DECIMAL(15,2),
    percentage DECIMAL(5,2),
    daily_interest DECIMAL(10,4),
    monthly_interest DECIMAL(5,2),
    grace_days INTEGER,
    UNIQUE(tenant_id)
);

CREATE TABLE loan_config (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    default_interest_rate DECIMAL(5,2),
    min_amount DECIMAL(15,2),
    max_amount DECIMAL(15,2),
    min_installments INTEGER,
    max_installments INTEGER,
    UNIQUE(tenant_id)
);
```

### Notificações e Mensagens

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ
);

CREATE TABLE message_templates (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100),
    category VARCHAR(50),
    content TEXT,
    is_system BOOLEAN DEFAULT false,
    min_score INTEGER,
    max_score INTEGER,
    UNIQUE(tenant_id, name)
);

CREATE TABLE reminder_settings (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    enabled BOOLEAN DEFAULT true,
    days_before INTEGER[],
    hours INTEGER[],
    methods VARCHAR(20)[],
    UNIQUE(tenant_id)
);
```

### Fiadores e Garantias

```sql
CREATE TABLE guarantors (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255),
    document VARCHAR(20),
    document_type VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    guarantee_type VARCHAR(50),
    property_address TEXT,
    property_type VARCHAR(50),
    property_value DECIMAL(15,2),
    vehicle_brand VARCHAR(50),
    vehicle_model VARCHAR(50),
    vehicle_year VARCHAR(4),
    vehicle_plate VARCHAR(10),
    vehicle_value DECIMAL(15,2),
    linked_loan_id UUID REFERENCES loans(id),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Renegociação

```sql
CREATE TABLE loan_renegotiations (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    loan_id UUID REFERENCES loans(id),
    renegotiation_date DATE,
    original_total_amount DECIMAL(15,2),
    original_installments_count INTEGER,
    new_total_amount DECIMAL(15,2),
    new_installments_count INTEGER,
    new_installment_amount DECIMAL(15,2),
    interest_rate DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Auditoria e LGPD

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(50),
    entity_id UUID,
    action VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ
);

CREATE TABLE consent_logs (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    consent_type VARCHAR(100),
    granted BOOLEAN,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ
);
```

### Features e Configurações

```sql
CREATE TABLE tenant_features (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    feature_name VARCHAR(100),
    enabled BOOLEAN DEFAULT true,
    limit_value INTEGER,
    UNIQUE(tenant_id, feature_name)
);

CREATE TABLE tenant_settings (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    key VARCHAR(100),
    value TEXT,
    UNIQUE(tenant_id, key)
);

CREATE TABLE permission_templates (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    description TEXT,
    permissions JSONB,
    is_system BOOLEAN DEFAULT false
);
```

---

## 4.2 Índices para Performance

```sql
-- Clientes
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_document ON customers(document);
CREATE INDEX idx_customers_name ON customers(name);

-- Empréstimos
CREATE INDEX idx_loans_tenant ON loans(tenant_id);
CREATE INDEX idx_loans_customer ON loans(customer_id);
CREATE INDEX idx_loans_status ON loans(status);

-- Parcelas
CREATE INDEX idx_installments_loan ON loan_installments(loan_id);
CREATE INDEX idx_installments_status ON loan_installments(status);
CREATE INDEX idx_installments_due_date ON loan_installments(due_date);

-- Busca
CREATE INDEX idx_customers_name_gin ON customers USING gin(name_normalized gin_trgm_ops);
```

---

## 4.3 Funções de Busca

### search_customers

```sql
CREATE FUNCTION search_customers(
    p_tenant_id UUID,
    p_search TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    document TEXT,
    phone TEXT,
    email TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
```

Busca por nome (acentos insignificantes) e documento (apenas dígitos).

---

# 5. Segurança e Permissões

## 5.1 Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADAS DE SEGURANÇA                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   Frontend  │    │   tRPC API  │    │  Supabase   │        │
│  │             │    │             │    │   Backend   │        │
│  │ - Route     │    │ - Auth      │    │ - RLS       │        │
│  │   Guards    │    │ - Validate  │    │ - Row       │        │
│  │ - UI Hiding │    │ - Sanitize  │    │   Security  │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   Browser   │    │   Network   │    │   Database  │        │
│  │             │    │             │    │             │        │
│  │ - HTTPS     │    │ - TLS 1.3   │    │ - Encrypted │        │
│  │ - Cookies   │    │ - HSTS       │    │ - Backups   │        │
│  │ - CSP       │    │ - Headers   │    │ - RLS       │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 5.2 Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado:

```sql
-- Exemplo: Clientes só visualiza dados do próprio tenant
CREATE POLICY "Users can view own tenant customers"
ON customers FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Políticas por Tabela

| Tabela | Política |
|--------|----------|
| customers | tenant_id = current_tenant |
| loans | tenant_id = current_tenant |
| users | tenant_id = current_tenant |
| roles | tenant_id = current_tenant |
| notifications | user_id = current_user |
| audit_logs | tenant_id = current_tenant |

## 5.3 Sistema de Permissões (RBAC)

### Estrutura de Permissões

```typescript
type Permission =
  | "dashboard.view" | "dashboard.edit"
  | "customers.view" | "customers.create" | "customers.edit" | "customers.delete"
  | "loans.view" | "loans.create" | "loans.edit" | "loans.delete"
  | "collections.view" | "collections.edit"
  | "reports.view" | "reports.export"
  | "settings.view" | "settings.edit"
  | "*";  // Admin total
```

### Função de Verificação

```typescript
const hasPermission = (feature: string) => {
  // 1. Verifica se role tem permissão
  if (!userPermissions.includes(feature)) return false
  // 2. Verifica limitação do plano
  const limit = starterLimits[feature]
  if (limit === false) return false
  return true
}
```

### Aplicação no Menu

```typescript
// Filtrar navegação berdasarkan permissões
navigation.filter(item => hasPermission(item.permission))
```

## 5.4 Validações de Segurança

| Área | Implementação |
|------|----------------|
| CPF | Algoritmo de dígitos verificadores |
| Input | Sanitization de XSS |
| Password | Hash com bcrypt/pgcrypto |
| Session | Cookies HTTP-only + Secure |
| CORS | Configuração Next.js |

---

# 6. Funcionalidades Atuais - Resumo

## 6.1 Status de Implementação

### ✅ Completos (Frontend + Backend)

| Módulo | Funcionalidade | Status |
|--------|---------------|--------|
| **Auth** | Login, Registro, Logout | ✅ |
| **Dashboard** | KPIs, Gráficos, Métricas | ✅ |
| **Clientes** | CRUD, Busca, Status | ✅ |
| **Empréstimos** | CRUD, Cálculo, Parcelas | ✅ |
| **Cobranças** | Grid, Alertas, WhatsApp | ✅ |
| **Regras de Negócio** | Juros, Multa, Config | ✅ |
| **Equipe** | Convites, Permissões | ✅ |
| **Relatórios** | Financeiros, Fluxo, Analytics | ✅ |
| **Fiadores** | CRUD, Garantias | ✅ |
| **Renegociação** | Criação, Aprovação | ✅ |
| **Configurações** | Múltiplas telas | ✅ |
| **Globais** | Busca, Notificações | ✅ |

### ✅ Frontend Completo (Backend Pendente)

| Módulo | Status Frontend | Status Backend |
|--------|-----------------|----------------|
| Mensagens por Cliente | ✅ | ❌ |
| Status/Prioridade | ✅ | ❌ |
| Limite de Crédito | ✅ | ❌ |
| Numeração Contratos | ✅ | ❌ |
| Logs Auditoria | ✅ | ❌ |
| Geração PDF | ✅ | ❌ |
| Venda Rápida | ✅ | ❌ |
| Alertas Inteligentes | ✅ | ❌ |
| Notificações Realtime | ✅ | ❌ |

## 6.2 Mapa de Páginas

```
/
├── (auth)
│   ├── login
│   └── register
├── dashboard
│   ├── (main)
│   │   └── dashboard
│   ├── advanced
│   ├── customers
│   │   ├── (list)
│   │   ├── [id]
│   │   │   └── messages
│   │   ├── status
│   │   ├── scoring
│   │   └── segments
│   ├── loans
│   │   ├── (list)
│   │   ├── new
│   │   ├── [id]
│   │   └── quick
│   ├── collections
│   ├── alerts
│   ├── reports
│   │   ├── (main)
│   │   ├── financial
│   │   ├── cash-flow
│   │   └── analytics
│   ├── guarantors
│   ├── renegotiations
│   ├── quick-sale
│   ├── cash
│   ├── payments
│   └── settings
│       ├── (main)
│       ├── business-rules
│       ├── staff
│       ├── roles
│       ├── credit-limit
│       ├── contract-numbering
│       ├── audit-logs
│       ├── notifications
│       ├── message-templates
│       ├── approvals
│       ├── reminders
│       ├── lgpd
│       └── plan
```

---

# 7. Planejamento e Funcionalidades Pendentes

## 7.1 Funcionalidades Pendentes (Backend)

### 🔴 Prioridade Alta

| # | Funcionalidade | Descrição | Complexidade |
|---|----------------|-----------|---------------|
| 1 | Relatórios Financeiros Avançados | Dados reais para fluxo de caixa, inadimplência | Alta |
| 2 | Gestão de Fiadores/Garantias | CRUD completo, vinculação a loans | Média |
| 3 | Renegociação Completa | Criar novo contrato, notificar cliente | Alta |
| 4 | Busca Global | Endpoint unificado de pesquisa | Média |
| 5 | Notificações Realtime | Supabase Realtime + triggers | Alta |

### 🟡 Prioridade Média

| # | Funcionalidade | Descrição | Complexidade |
|---|----------------|-----------|---------------|
| 6 | Logs de Auditoria | Triggers de auditoria automática | Média |
| 7 | Rate Limiting | Proteção de requisições | Baixa |
| 8 | Cache Redis | Performance em listagens | Média |
| 9 | Otimização de Queries | Índices e paginação | Contínua |

### 🟢 Prioridade Baixa

| # | Funcionalidade | Descrição | Complexidade |
|---|----------------|-----------|---------------|
| 10 | Roteiro de Cobrança | Automação de lembretes | Média |
| 11 | Histórico de Interações | Timeline por cliente | Média |
| 12 | Segmentação Automática | Tags dinâmicas | Média |
| 13 | Testes Automatizados | Jest + Cypress | Alta |
| 14 | Monitoramento | Sentry + Datadog | Média |

## 7.2 Roadmap Sugerido

### Sprint 1-2: Funcionalidades Core
- [ ] Busca Global (API)
- [ ] Notificações Realtime
- [ ] Dados reais nos Relatórios Financeiros

### Sprint 3-4: Segurança e Performance
- [ ] Rate Limiting
- [ ] Cache Redis
- [ ] Logs de Auditoria

### Sprint 5-6: Automação
- [ ] Roteiro de Cobrança
- [ ] Segmentação Automática
- [ ] Testes

### Sprint 7-8: Monitoramento
- [ ] Sentry
- [ ] Datadog
- [ ] Alertas automáticos

## 7.3 Estimativas de Desenvolvimento

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

## 7.4 White-Label (Verificar com Cliente)

⚠️ **IMPORTANTE**: Antes de implementar, verificar se o cliente deseja esta funcionalidade.

Funcionalidades white-label:
- Logo customizado
- Domínio próprio
- Cores customizadas
- URL customizada

---

# 8. Considerações Finais

## 8.1 Pontos Fortes do Sistema

1. **Stack moderno**: Next.js 14, TypeScript, tRPC
2. **Multi-inquilino**: Pronto para múltiplos clientes
3. **UI completa**: Todas as funcionalidades tem interface
4. **Segurança**: RLS, validações, permissões
5. **Type-safe**: API completamente tipada

## 8.2 Pontos de Atenção

1. **Backend incompleto**: Várias funcionalidades precisam de API
2. **Performance**: Necessita otimização com Redis
3. **Testes**: Falta cobertura de testes
4. **Documentação**: APIs precisam ser documentadas

## 8.3 Próximos Passos

1. Implementar backend das funcionalidades pendentes
2. Configurar Redis para performance
3. Adicionar testes automatizados
4. Configurar monitoramento (Sentry/Datadog)
5. Implementar white-label (se solicitado)

---

*Documento gerado automaticamente em 2026-04-07*
*AXION Cred - Product Design Document*