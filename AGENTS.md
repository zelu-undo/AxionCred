# AXION Cred - Agentes Documentation

## Project Overview
AXION is a SaaS credit management platform for small businesses. Built with Next.js 14 (App Router), tRPC, and Supabase.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, React Query, Framer Motion
- **Backend**: Node.js with tRPC (type-safe API)
- **Database**: PostgreSQL (Supabase) with RLS
- **Authentication**: Supabase Auth
- **Animations**: Framer Motion (page transitions, staggered animations, hover effects)

## Authentication Architecture

### AuthProvider (`src/contexts/auth-context.tsx`)
O AuthProvider gerencia todo o estado de autenticação no lado do cliente (client-side):

**Estados:**
- `user`: Usuário autenticado ou null
- `loading`: Indica se a verificação de sessão está em andamento
- `isInitialized`: Indica se a verificação inicial foi completada

**Métodos:**
- `signIn(email, password)`: Realiza login
- `signUp(email, password, name)`: Realiza cadastro
- `signOut()`: Realiza logout
- `refreshSession()`: Força verificação de sessão

**Características:**
- Cache de verificação de sessão (5 segundos) para evitar verificações redundantes
- Prevenção de race conditions com `isCheckingRef`
- Limpeza de cache antes de operações de login/logout
- Sincronização automática com eventos `onAuthStateChange` do Supabase

### Middleware (`src/middleware.ts`)
O middleware verifica autenticação no lado do servidor:

**Comportamento:**
- Rotas públicas: Permite acesso sem autenticação
- Rotas protegidas: Verifica sessão e permite renderização (não redireciona imediatamente)
- Rotas de auth (/login, /register): Se já autenticado, redireciona para dashboard

**Importante:** O middleware NÃO faz redirect imediato quando não há sessão. Permite que o cliente (AuthProvider) lidere com isso para evitar race conditions.

### Páginas de Auth

**Login (`src/app/(auth)/login/page.tsx`):**
- Verifica se usuário já está autenticado (isInitialized + user)
- Se autenticado, redireciona automaticamente para /dashboard
- Limpa estados residuais ao montar componente
- Previne múltiplas requisições simultâneas (isSubmitting)
- Mostra "Verificando autenticação..." enquanto carrega

**Register (`src/app/(auth)/register/page.tsx`):**
- Mesmo comportamento do Login
- Redirect automático se já autenticado

### Fluxo de Autenticação

1. **Acesso à rota protegida:**
   - Middleware permite renderização
   - AuthProvider verifica sessão
   - Se não autenticado: mostra loading → depois redireciona para /login
   
2. **Login:**
   - Usuário entra com credenciais
   - AuthProvider limpa cache, faz signIn
   - Se sucesso: atualiza estado + cache + redirect para /dashboard
   - Se erro: mostra mensagem de erro

3. **Refresh (F5):**
   - AuthProvider verifica sessão com cache
   - Se cache válido (5s), usa dados em cache
   - Caso contrário, busca nova sessão

4. **Múltiplas abas:**
   - Eventos onAuthStateChange sincronizam estado entre abas
   - Logout em uma aba reflete em todas

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── dashboard/      # Dashboard home
│   │   ├── customers/      # Customer management
│   │   ├── loans/          # Loan management
│   │   ├── collections/    # Collection management
│   │   ├── alerts/        # Alerts system
│   │   ├── reports/       # Reports
│   │   │   └── financial/ # Financial reports (new)
│   │   ├── guarantors/    # Guarantors & guarantees (new)
│   │   ├── renegotiations/ # Debt renegotiation (new)
│   │   ├── quick-sale/    # Quick sale
│   │   └── settings/      # Settings
│   └── api/trpc/           # tRPC API routes
├── components/
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   │   ├── tabs.tsx       # Tabs component (new)
│   │   └── ...
│   └── dashboard/           # Dashboard-specific components
├── lib/                    # Utilities
├── server/
│   ├── db/                 # Database schema (SQL)
│   ├── routers/            # tRPC routers
│   ├── trpc.ts             # tRPC setup
│   └── supabase.ts         # Supabase server client
├── trpc/                   # tRPC client
├── contexts/               # React contexts (auth)
├── hooks/                  # Custom hooks
├── i18n/                   # Internationalization
└── types/                  # TypeScript types
```

## New Features (2026-03)

### Financial Reports (`/reports/financial`)
- Cash flow analysis (revenue, expenses, profit)
- Projected cash flow based on installments
- Default rate report by period
- Team performance metrics

### Guarantors Management (`/guarantors`)
- Guarantor registration and management
- Property, vehicle, and personal guarantees
- Link guarantees to loans

### Debt Renegotiation (`/renegotiations`)
- Create renegotiation with new terms
- Keep original loan history
- Approve/reject workflow

### Global Search
- Search across customers, loans, installments, staff
- Keyboard shortcut (Cmd/Ctrl + K)

### Real-time Notifications
- Payment notifications
- Overdue alerts
- New loan notifications

## Running the Project
```bash
npm run dev
```

## Database Setup
Run the SQL in `src/server/db/schema.sql` in your Supabase project.

## Environment Variables
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Vercel Deployment

### Environment Variables in Vercel
Add the following environment variables in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ogtbegrzbuzophdcdpjm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ndGJlZ3J6YnV6b3BoZGNkcGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzEzNDcsImV4cCI6MjA4OTQ0NzM0N30.MuVFIrF2Dw6a6ZqbqNGW95n1_1w1mLoo2BmoHPawoDw` |

### Supabase Setup Steps
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API to get your URL and anon key
3. Run the SQL schema in `src/server/db/schema.sql` via the Supabase SQL Editor
4. Add the environment variables to Vercel
5. Redeploy your project

---

## 📘 Manual de Identidade Visual – AXION

### 1. Propósito da marca
- **Missão visual:** Transmitir confiança, firmeza, simplicidade e modernidade.
- **Tom:** Direto, humano, sem rodeios. "Feito para quem vive do dia a dia."

---

### 2. Paleta de cores (versão simplificada)

| Cor | Hexadecimal | Uso principal | Onde aplicar |
|------|-------------|---------------|--------------|
| **Azul principal** | `#1E3A8A` (ou similar) | Base de confiança | Fundos, cards, elementos estruturais |
| **Verde principal** | `#22C55E` | Ação positiva, dinheiro recebido | Botões primários, ícones de sucesso, destaque do "X" na logo |
| **Verde neon (detalhe)** | `#4ADE80` (mais claro) | Hover, brilho, microinterações | Efeitos de hover, loading, detalhes sutis |
| **Vermelho (alerta)** | `#EF4444` | Status de atraso, erros | Badges de "atrasado", mensagens de erro |
| **Amarelo (atenção)** | `#F59E0B` | Alertas moderados, avisos | Badges de "vence hoje", mensagens de atenção |
| **Cinza escuro** | `#374151` | Textos secundários | Labels, descrições |
| **Branco** | `#FFFFFF` | Texto principal em fundos escuros | Texto sobre azul/verde |
| **Preto** | `#111827` | Fundo alternativo | Pode ser usado em modais ou contrastes |

**Regras de ouro:**
- Use o **verde neon** com moderação – apenas para dar vida a elementos interativos.
- Nunca misture mais de 3 cores na mesma tela (além de tons neutros).
- Mantenha alto contraste entre texto e fundo (acessibilidade).

---

### 3. Tipografia

**Fonte única:** **Poppins** (ou **Montserrat**, se preferir) – ambas são geométricas, legíveis e passam modernidade.

| Elemento | Peso | Tamanho (referência) | Uso |
|----------|------|----------------------|-----|
| Títulos | Bold (700) | 32px+ | Headlines, seções importantes |
| Subtítulos | SemiBold (600) | 20-24px | Seções secundárias |
| Corpo de texto | Regular (400) | 16px | Descrições, parágrafos |
| Labels e botões | Medium (500) | 14-16px | Textos de ação, badges |

**Regras:**
- Sempre use **caixa alta** apenas em badges ou CTAs específicos (ex.: "PROMOÇÃO").
- Evite itálico e versalete – mantenha a simplicidade.

---

### 4. Ícones

**Estilo único:** **Outline (traço)**, com espessura consistente (1.5px ou 2px).

- Use ícones da mesma família (ex.: Lucide, Feather Icons ou Font Awesome Outline).
- Ícones preenchidos só em situações de estado ativo (ex.: menu selecionado) ou em botões de CTA muito específicos.
- Tamanhos padrão: 20px (interface), 24px (botões grandes), 32px (ilustrações).

---

### 5. Gradientes

- **Permitido apenas em:** botões primários (hover) ou elementos de destaque muito pontuais.
- **Direção:** sempre de cima para baixo ou da esquerda para a direita, suave.
- **Cores:** use o azul principal como base e o verde principal como luz (ex.: `linear-gradient(135deg, #1E3A8A, #22C55E)`).

**Proibido:** usar gradiente em fundos de página, cards ou textos.

---

### 6. Logotipo

- **Versão principal:** "AXION" em fonte grossa (bold), letras brancas sobre fundo azul escuro ou preto. O "X" em verde principal (`#22C55E`).
- **Versão reduzida (favicon/avatar):** apenas o "X" verde sobre fundo escuro, ou as letras "AX" (X verde).
- **Espaço de segurança:** mantenha um espaçamento equivalente à altura do "X" ao redor do logo.
- **Não permitido:** distorcer, mudar cores, adicionar sombras exageradas ou efeitos 3D.

---

### 7. Aplicação em interfaces (UI)

| Componente | Cor de fundo | Texto | Detalhes |
|------------|--------------|-------|----------|
| Botão primário | Verde principal (`#22C55E`) | Branco (bold) | Hover: verde neon (`#4ADE80`) |
| Botão secundário | Transparente, borda branca | Branco | Hover: fundo branco com texto azul |
| Card | Azul escuro (`#1E3A8A`) com 10% de opacidade? Na verdade, melhor usar um tom mais claro de azul (#2A4A9F) para contraste | Branco/cinza claro | Borda sutil (1px, branca com 10%) |
| Badge "Pago" | Verde principal | Branco | Ícone de check outline |
| Badge "Atrasado" | Vermelho | Branco | Ícone de alerta |
| Badge "Vence hoje" | Amarelo | Preto (para contraste) | Ícone de relógio |
| Tabelas | Linhas intercaladas: azul escuro (#1E3A8A) e um tom mais claro (#2D4BA0) | Branco | |

---

### 8. Estilo de imagens e ilustrações

- Prefira **fotos reais de comerciantes** (com autorização) em vez de ilustrações genéricas.
- Se usar ilustrações, que sejam simples, traço limpo, com as cores da marca.
- Evite fotos muito produzidas ou de banco de imagens óbvias.

---

### 9. Tom de voz (reflexo visual)

- Frases curtas, diretas, imperativas ("Começar a cobrar agora").
- Uso de interjeições e linguagem coloquial controlada ("Pare de perder dinheiro").
- Nada de termos técnicos ("gestão de crédito", "SaaS", "dashboard").

---

### 10. O que NÃO fazer

- ❌ Usar mais de 3 cores principais na mesma tela.
- ❌ Aplicar gradientes em fundos ou cards.
- ❌ Misturar estilos de ícones (outline com filled sem critério).
- ❌ Usar fontes serifadas ou manuscritas.
- ❌ Deixar o design muito "clean" ou "luxuoso" – lembre-se: o público é simples.
- ❌ Colocar o "X" da logo em outra cor que não o verde definido.
- ❌ Exagerar no verde neon – ele é um tempero, não o prato principal.
