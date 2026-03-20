# AXION Cred - Plataforma de Gestão de Crédito

![AXION Cred](https://img.shields.io/badge/AxionCred-v1.0.0-purple)
![Next.js](https://img.shields.io/badge/Next.js-16-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 O que é o AXION Cred?

AXION Cred é uma plataforma SaaS de infraestrutura de crédito e confiança digital, desenvolvida especificamente para **pequenos empreendedores, pequenos comerciantes e freelancers** na América Latina.

### Recursos Principais

- 📊 **Dashboard Completo** - Visão geral da operação com KPIs e métricas
- 👥 **Gestão de Clientes** - Cadastro e gerenciamento de clientes
- 💰 **Controle de Empréstimos** - Criação e acompanhamento de empréstimos com cálculo automático de juros
- 📅 **Cobranças** - Gerenciamento de inadimplência com integração WhatsApp
- 🌐 **Multiidioma** - Suporte para Português, Inglês e Espanhol
- 🔐 **Autenticação** - Sistema de login e registro de usuários
- ⚙️ **Configurações** - Perfil, notificações e segurança

## 🛠️ Tecnologias

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Estilização**: Tailwind CSS, shadcn/ui
- **Backend**: tRPC, Supabase (Auth, Database)
- **i18n**: internationalization com react-i18next

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/zelu-undo/AxionCred.git
cd AxionCred

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Execute o servidor de desenvolvimento
npm run dev
```

### Configuração do Supabase

Para que o sistema funcione com dados reais, você precisa configurar o Supabase:

1. **Crie um projeto** em [supabase.com](https://supabase.com)

2. **Configure as variáveis de ambiente** no arquivo `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```

3. **Execute o SQL** abaixo no **SQL Editor** do Supabase para criar as tabelas:

```sql
-- Tabela de clientes
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  document TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  credit_limit DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de empréstimos
CREATE TABLE loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES auth.users(id),
  principal DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  installments INTEGER NOT NULL,
  paid_installments INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  first_payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pagamentos
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES loans(id),
  installment_number INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view own customers" ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customers" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customers" ON customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customers" ON customers FOR DELETE USING (auth.uid() = user_id);
```

### Modo Demo

O sistema possui um **modo demo** que funciona sem necessidade de configurar o Supabase. Para testar:
1. Acesse `/login`
2. Use qualquer e-mail e senha
3. Você terá acesso ao dashboard com dados de exemplo

## 📱 Páginas Disponíveis

| Rota | Descrição |
|------|------------|
| `/` | Landing page com informações do produto |
| `/login` | Página de login |
| `/register` | Página de cadastro |
| `/dashboard` | Dashboard principal com KPIs |
| `/dashboard/advanced` | Dashboard avançado com gráficos |
| `/customers` | Gestão de clientes |
| `/customers/[id]` | Detalhes do cliente |
| `/customers/[id]/messages` | Mensagens WhatsApp |
| `/customers/status` | Status e prioridade |
| `/loans` | Lista de empréstimos |
| `/loans/new` | Criar novo empréstimo |
| `/loans/[id]` | Detalhes do empréstimo |
| `/loans/quick` | Venda rápida |
| `/collections` | Gerenciamento de cobranças |
| `/quick-sale` | Venda rápida simplificada |
| `/alerts` | Alertas e notificações |
| `/reports` | Geração de relatórios |
| `/reports/financial` | Relatórios financeiros avançados |
| `/guarantors` | Gestão de fiadores e garantias |
| `/renegotiations` | Renegociação de dívidas |
| `/settings` | Configurações do usuário |
| `/settings/business-rules` | Regras de juros |
| `/settings/staff` | Gestão de funcionários |
| `/settings/roles` | Funções e permissões |
| `/settings/credit-limit` | Limite de crédito |
| `/settings/contract-numbering` | Numeração de contratos |
| `/settings/audit-logs` | Logs de auditoria |
| `/settings/notifications` | Configurações de notificações |
| `/settings/message-templates` | Templates de mensagem |

## 🌐 Internacionalização

O sistema suporta os seguintes idiomas:
- 🇧🇷 Português (Brasil) - Padrão
- 🇺🇸 Inglês (US)
- 🇪🇸 Espanhol

Para alterar o idioma, use o seletor no header do dashboard.

## 📂 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Páginas de autenticação
│   ├── (dashboard)/       # Páginas do dashboard
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/               # Componentes shadcn/ui
│   └── dashboard/         # Componentes do dashboard
├── contexts/              # React Contexts
├── i18n/                 # Traduções
├── lib/                  # Utilitários
└── trpc/                 # API tRPC
```

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build   # Build de produção
npm run start   # Servidor de produção
npm run lint   # Verificar erros de lint
```

## 📄 Licença

MIT License - sinta-se livre para usar e modificar.

## 👨‍💻 Autor

Desenvolvido por [Zelu](https://github.com/zelu-undo)

---

<p align="center">Feito com ❤️ para pequenos empreendedores</p>
