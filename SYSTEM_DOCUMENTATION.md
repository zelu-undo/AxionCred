# AXION Cred - Documentação do Sistema

## Visão Geral

AXION Cred é uma plataforma SaaS de gestão de crédito para pequenos negócios. Permite gerenciar clientes, empréstimos, cobranças e equipe de forma integrada.

### Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, React Query, Framer Motion
- **Backend**: Node.js com tRPC (API type-safe)
- **Database**: PostgreSQL (Supabase) com RLS
- **Autenticação**: Supabase Auth

---

## 1. Autenticação

### Fluxo de Login
1. Usuário acessa `/login`
2. Insere e-mail e senha
3. Sistema verifica credenciais via Supabase Auth
4. Se sucesso, cria sessão e redireciona para `/dashboard`
5. Sessão persistida via cookies

### Proteção de Rotas
- Middleware (`src/middleware.ts`) verifica autenticação no servidor
- Rotas protegidas: redirecionam para `/login` se não autenticado
- Rotas públicas: `/`, `/login`, `/register`, `/demo`

### Estados de Sessão
```typescript
interface User {
  id: string
  tenant_id: string
  email: string
  name: string
  role: "owner" | "admin" | "manager" | "operator"
}
```

---

## 2. Gestão de Clientes

### Estrutura do Cliente
```typescript
interface Customer {
  id: string
  tenant_id: string
  name: string
  email?: string
  phone: string
  document?: string  // CPF ou CNPJ
  address?: string
  status: "active" | "inactive" | "blocked"
  credit_limit?: number
  created_at: string
  updated_at: string
}
```

### Validações
- **CPF**: Validação algorítmica (dígitos verificadores)
- **Telefone**: Formato brasileiro com máscara
- **CEP**: Busca automática via ViaCEP

### Funcionalidades
- Listagem com paginação
- Busca por nome, e-mail, telefone ou documento
- Cadastro completo com endereço
- Status ativo/inativo
- Limite de crédito individual

---

## 3. Gestão de Empréstimos

### Estrutura do Empréstimo
```typescript
interface Loan {
  id: string
  tenant_id: string
  customer_id: string
  principal_amount: number        // Valor solicitado
  interest_rate: number           // Taxa de juros (decimal)
  total_amount: number            // Total com juros
  paid_amount: number            // Valor já pago
  remaining_amount: number        // Saldo devedor
  installments_count: number      // Total de parcelas
  paid_installments: number      // Parcelas pagas
  status: "pending" | "active" | "paid" | "cancelled" | "renegotiated"
}
```

### Cálculo de Juros (Sistema Price)
```
Parcela = Principal × [i(1+i)^n] / [(1+i)^n - 1]

Onde:
- i = taxa de juros mensal
- n = número de parcelas
```

### Status de Empréstimo
| Status | Descrição |
|--------|-----------|
| pending | Aguardando aprovação |
| active | Em andamento |
| paid | Quitado |
| cancelled | Cancelado |
| renegotiado | Renegociado |

### Parcelas
```typescript
interface LoanInstallment {
  id: string
  loan_id: string
  installment_number: number
  amount: number           // Valor da parcela
  paid_amount?: number     // Valor pago
  due_date: string         // Data de vencimento
  paid_date?: string       // Data de pagamento
  status: "pending" | "paid" | "late" | "cancelled"
}
```

---

## 4. Sistema de Juros e Regras de Negócio

### Regras de Juros por Parcela
Configuração por faixa de parcelas:

```typescript
interface InterestRule {
  id: string
  tenant_id: string
  min_installments: number   // Parcelas mínimas
  max_installments: number   // Parcelas máximas
  interest_rate: number      // Taxa de juros (ex: 0.50 = 50%)
  interest_type: "monthly" | "weekly"
  created_at: string
}
```

**Exemplo:**
| Faixa de Parcelas | Taxa de Juros |
|--------------------|----------------|
| 1-5x | 50% |
| 6-10x | 80% |
| 11-12x | 100% |

### Multa por Atraso
```typescript
interface LateFeeConfig {
  id: string
  tenant_id: string
  fee_type: "fixed" | "percentage"
  fee_value: number
  interest_daily?: number    // Juros diários por atraso
}
```

### Regras de Validação
- Não permitir sobreposição de faixas de parcelas
- Imutabilidade: alterações não afetam contratos existentes

---

## 5. Cobranças

### Tipos de Alerta
- **Parcela vencida**: Há dias em atraso
- **Vencimento próximo**: Vence em X dias
- **Cliente inadimplente**: Múltiplas parcelas atrasadas

### Integração WhatsApp
- Envio de mensagens via API do WhatsApp
- Templates personalizados por situação
- Variáveis dinâmicas (nome, valor, data)

---

## 6. Controle de Acesso (RBAC)

### Funções Pré-definidas

| Função | Dashboard | Clientes | Empréstimos | Cobranças | Relatórios | Config |
|--------|-----------|----------|-------------|-----------|------------|--------|
| Owner | ✦ | ✦ | ✦ | ✦ | ✦ | ✦ |
| Admin | ✦ | ✦ | ✦ | ✦ | ✦ | ✦ |
| Manager | ✦ | ✦ | ✦ | ✦ | - | - |
| Operador | ✦ | ✦ | ✦ | ✦ | - | - |
| Visualizador | ✦ | ✦ | - | - | - | - |

✦ = Todas as permissões (visualizar, criar, editar, excluir)

### Estrutura de Função
```typescript
interface CustomRole {
  id: string
  owner_id: string
  name: string
  description?: string
  permissions: RolePermission[]
  is_default: boolean
}

interface RolePermission {
  module: string        // dashboard, customers, loans, etc.
  view: boolean         // Visualizar
  create: boolean       // Criar
  edit: boolean         // Editar
  delete: boolean       // Excluir
}
```

---

## 7. Gestão de Funcionários

### Convite de Funcionários
1. Proprietário acessa `/settings/staff`
2. Clica em "Convidar Funcionário"
3. Preenche nome, e-mail e seleciona função
4. Sistema envia convite (simulado)
5. Funcionário recebe e-mail e aceita

### Status de Convite
| Status | Descrição |
|--------|-----------|
| pending | Convite enviado, aguardando aceite |
| accepted | Funcionário aceitou e está ativo |
| expired | Convite expirou |
| cancelled | Convite cancelado pelo proprietário |

### Isolamento de Dados
- Cada funcionário está vinculado ao `owner_id` do convite
- Funcionários só veem dados do proprietário que os convidou
- Preparado para futura implementação de backend

---

## 8. Módulos e Páginas

### Estrutura de Rotas

```
/                           → Landing Page
/login                      → Login
/register                  → Cadastro
/demo                      → Demo mode
/dashboard                 → Dashboard principal
/dashboard/advanced        → Dashboard avançado
/customers                 → Lista de clientes
/customers/[id]            → Detalhes do cliente
/customers/[id]/messages   → Mensagens WhatsApp
/customers/status          → Status e Prioridade
/loans                     → Lista de empréstimos
/loans/new                 → Novo empréstimo
/loans/[id]                → Detalhes do empréstimo
/loans/quick              → Venda rápida
/collections               → Cobranças
/quick-sale               → Venda Rápida
/alerts                   → Alertas Inteligentes
/reports                  → Relatórios/PDF
/reports/financial        → Relatórios Financeiros Avançados
/guarantors               → Fiadores e Garantias
/renegotiations           → Renegociação de Dívidas
/settings                 → Configurações gerais
/settings/business-rules   → Regras de Juros
/settings/staff           → Gestão de Funcionários
/settings/roles           → Funções e Permissões
/settings/credit-limit   → Limite de Crédito
/settings/contract-numbering → Numeração de Contratos
/settings/audit-logs     → Logs de Auditoria
/settings/notifications  → Configurações de Notificações
/settings/message-templates → Templates de Mensagem
```

---

## 9. Componentes UI

### Design System
Cores baseadas na identidade visual AXION:

| Cor | Hex | Uso |
|-----|-----|-----|
| Azul Principal | `#1E3A8A` | Fundos, elementos estruturais |
| Verde Principal | `#22C55E` | Botões primários, ações positivas |
| Verde Neon | `#4ADE80` | Hover, microinterações |
| Vermelho | `#EF4444` | Erros, alertas, status de atraso |
| Amarelo | `#F59E0B` | Avisos, pendências |

### Componentes Principais
- `Button` - Botões com variantes (primary, secondary, ghost, destructive)
- `Input` - Campos de entrada com máscaras
- `Select` - Dropdowns
- `Dialog` - Modais
- `Card` - Cards com header e content
- `Badge` - Tags e status
- `Table` - Tabelas com dados

---

## 10. Integrações

### ViaCEP
- Endpoint: `https://viacep.com.br/ws/{cep}/json/`
- Preenche automaticamente: logradouro, bairro, cidade, UF

### Supabase
- Auth: Autenticação de usuários
- Database: PostgreSQL com RLS
- Storage: Arquivos e documentos

---

## 11. Funcionalidades do Frontend (Implementadas)

### Relatórios Financeiros (`/reports/financial`)
- Dashboard de fluxo de caixa (receita, despesas, lucro)
- Projeção de fluxo de caixa baseada em parcelas a receber
- Relatório de inadimplência por período
- Relatório de performance da equipe de cobrança

### Fiadores e Garantias (`/guarantors`)
- Gestão de fiadores (pessoa física/jurídica)
- Cadastro de garantias (imóvel, veículo, fiador)
- Vinculação de garantias a empréstimos
- Status: ativo, inativo, verificado, pendente

### Renegociação de Dívidas (`/renegotiations`)
- Criação de renegociação com novas condições
- Histórico do empréstimo original
- Workflow de aprovação/rejeição
- Simulação de novas parcelas

### Busca Global
- Campo de busca no header com atalho Cmd+K
- Pesquisa em clientes, empréstimos, parcelas

### Notificações em Tempo Real
- Dropdown de notificações no header
- Tipos: pagamento, vencimento, alerta

---

## 12. Funcionalidades Pendentes (Backend)

### Fase 6: Mensagens por Cliente
- [ ] API para envio real via WhatsApp
- [ ] Integração com provedor de SMS
- [ ] Histórico de mensagens enviadas

### Fase 7: Status e Prioridade
- [ ] Cálculo automático de status
- [ ] Algoritmo de prioridade por valor/tempo
- [ ] Atualização em tempo real

### Fase 8: Limite de Crédito
- [ ] Regras automáticas de limite
- [ ] Integração com caixa/fluxo de caixa
- [ ] Limite por cliente baseado em score

### Fase 9: Numeração de Contratos
- [ ] Modelos configuráveis
- [ ] Numeração sequencial
- [ ] Prefix por empresa/cliente

### Fase 10: Logs e Auditoria
- [ ] Registro de todas as ações
- [ ] Histórico completo por entidade
- [ ] Análise por funcionário

### Fase 11: Geração de PDF
- [ ] Geração real de PDF
- [ ] Templates profissional
- [ ] Assinatura digital

### Fase 12: Venda Rápida
- [ ] Criação real de empréstimo
- [ ] Integração com gateway de pagamento

### Fase 13: Alertas Inteligentes
- [ ] Sistema de notificações push
- [ ] E-mail notifications
- [ ] Dashboard analítico

---

## 12. Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

---

## 13. Executando o Projeto

```bash
# Instalação de dependências
npm install

# Desenvolvimento
npm run dev

# Build produção
npm run build

# Deploy Vercel
vercel --prod
```

---

## 14. Estrutura de Arquivos

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Páginas de autenticação
│   ├── (dashboard)/       # Páginas autenticadas
│   └── api/               # API routes
├── components/
│   ├── ui/                # Componentes base (shadcn)
│   └── dashboard/          # Componentes específicos
├── contexts/              # React Contexts
├── hooks/                 # Custom hooks
├── lib/                   # Utilitários
├── server/
│   ├── db/               # Schema do banco
│   ├── routers/          # tRPC routers
│   └── supabase.ts       # Cliente Supabase
├── trpc/                 # tRPC client
└── types/                # TypeScript interfaces
```

---

## 15. Controles de Permissão

### Função `hasPermission`
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
navigation.filter(item => hasPermission(item.permission))
```

---

## 16. Validações

### CPF
- 11 dígitos
- Dígitos verificadores válidos
- Não permitir CPFs sequenciais (111.111.111-11)

### CEP
- 8 dígitos
- Busca automática via API
- Preenchimento de campos de endereço

### E-mail
- Formato válido
- uniqueness no banco

---

## 17. Mensagens e Notificações

### Tipos de Notificação
- `payment_reminder` - Lembrete de pagamento
- `payment_overdue` - Pagamento atrasado
- `payment_received` - Pagamento recebido
- `loan_created` - Empréstimo criado
- `customer_added` - Cliente adicionado

### Canais
- **In-app**: Notificações no sistema
- **WhatsApp**: Mensagens via API
- **E-mail**: (pendente implementação)

---

## 18. Considerações de Segurança

### Row Level Security (RLS)
- Cada tenant vê apenas seus dados
- isolation por `tenant_id`
- Policies por tabela

### Validações
- Input sanitization
- Rate limiting (pendente)
- CSRF protection (Next.js built-in)

---

*Última atualização: 2026-03-20*
