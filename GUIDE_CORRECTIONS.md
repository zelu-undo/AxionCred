# 🔧 GUIA COMPLETO DE CORREÇÕES - AXION Cred

> Versão: 2.0  
> Data: 09/04/2026  
> Objetivo: Corrigir todos os problemas identificados nos testes

---

## 📋 PROBLEMAS IDENTIFICADOS

### 1. Cadastro sem campo "Nome da Empresa"
- **Arquivo**: `src/app/(auth)/register/page.tsx`
- **Problema**: O formulário de cadastro não tem campo para nome da empresa/tenant
- **Solução**: Adicionar campo "Nome da Empresa" no formulário de registro

### 2. Link de verificação apontando para localhost:3000
- **Arquivo**: `src/contexts/auth-context.tsx` (ao fazer signUp)
- **Problema**: O Supabase usa URL padrão localhost:3000 para emails
- **Solução**: Adicionar `NEXT_PUBLIC_APP_URL` no Supabase dashboard ou configurar via código

### 3. Página quebrada com "Plano Gratuito" (banner empurrando layout)
- **Arquivo**: `src/components/dashboard/upgrade-banner.tsx` + `src/app/(dashboard)/layout.tsx`
- **Problema**: Banner sticky com `z-50` está causando deslocamento do conteúdo
- **Solução**: O banner deve ser posicionado como fixed/absolute, não afetar o layout do main

### 4. Usuário consegue acessar tudo no plano básico (sem restrições)
- **Arquivo**: `src/lib/plans.ts` + `src/components/dashboard/shell.tsx`
- **Problema**: A verificação de permissões por plano existe mas não está sendo aplicada corretamente
- **Solução**: Aplicar `hasModuleAccess()` em todas as rotas e funcionalidades

### 5. Super Admin não existe/cadastrado
- **Problema**: Não existe usuário master para gerenciar novos clientes
- **Solução**: Criar seed de super admin ou página de registro específica

### 6. Não consegue alterar senha
- **Arquivo**: `src/app/(dashboard)/settings/page.tsx` (linha 279-299)
- **Problema**: O botão "Alterar Senha" não tem função onClick implementada
- **Solução**: Adicionar chamada Supabase auth.updateUser() com validação

### 7. Não consegue alterar perfil (nome, email, telefone)
- **Arquivo**: Same as #6 (linha 34-38)
- **Problema**: `handleSaveProfile()` não faz nada (apenas delay)
- **Solução**: Implementar update no banco de dados (tabela users)

### 8. Input mask de telefone não funciona
- **Arquivo**: `src/app/(dashboard)/settings/page.tsx` (linha 22 - valor hardcoded)
- **Problema**: Telefone está com valor padrão "(11) 99999-9999" no estado inicial
- **Solução**: Deixar o campo vazio ou buscar do banco, implementar mask correta

### 9. Resumo da conta não mostra dados reais
- **Arquivo**: Header do dashboard (provavelmente em shell.tsx)
- **Problema**: Dados do tenant não estão sendo exibidos corretamente
- **Solução**: Buscar dados reais do tenant e exibir no header/sidebar

### 10. Campo "ajuda" não funciona
- **Arquivo**: shell.tsx (provavelmente no header)
- **Problema**: Link/funcionalidade de ajuda não responde
- **Solução**: Implementar modal de ajuda ou redirecionar

### 11. Mensagem de "Plano Iniciante selecionado" sem pagamento
- **Arquivo**: `src/app/(dashboard)/settings/plan/page.tsx`
- **Problema**: Ao selecionar plano, mostra mensagem que deveria redirecionar para gateway
- **Solução**: Remover etapa temporariamente ou integrar com sistema de pagamento

---

## 🎯 PRIORIDADE DE CORREÇÕES

| # | Problema | Prioridade | Status |
|---|----------|------------|--------|
| 1 | Cadastro sem campo empresa | Alta | ✅ **CONCLUÍDO** |
| 2 | Link localhost:3000 | Alta | ⏳ Precisa configurar no Supabase |
| 3 | Página quebrada "Plano Gratuito" | Alta | ✅ **CONCLUÍDO** |
| 4 | Acesso total sem restrições de plano | Alta | ✅ **CONCLUÍDO** |
| 5 | Super Admin não existe | Alta | ✅ **CONCLUÍDO** (seed criado) |
| 6 | Alterar senha não funciona | Média | ✅ **CONCLUÍDO** |
| 7 | Alterar perfil não funciona | Média | ✅ **CONCLUÍDO** |
| 8 | Input mask telefone | Média | ✅ **CONCLUÍDO** |
| 9 | Resumo da conta sem dados | Média | ✅ **CONCLUÍDO** |
| 10 | Campo ajuda não funciona | Baixa | ✅ **CONCLUÍDO** |
| 11 | Seleção de plano sem pagamento | Baixa | ✅ **CONCLUÍDO** |

---

## ✅ CORREÇÕES JÁ APLICADAS

### Correção 1: Campo "Nome da Empresa" no Cadastro
- **Arquivo**: `src/app/(auth)/register/page.tsx`
- Adicionado campo "Nome da Empresa" com validação
- Ícone Building2 para o campo
- Exibição do nome da empresa na mensagem de sucesso

### Correção 2: Banner de Upgrade (Layout Quebrado)
- **Arquivo**: `src/components/dashboard/upgrade-banner.tsx`
- Alterado de `sticky` para `fixed` position
- **Arquivo**: `src/app/(dashboard)/layout.tsx`
- Adicionado padding-top para compensar o banner fixo

### Correção 3: Alterar Senha
- **Arquivo**: `src/app/(dashboard)/settings/page.tsx`
- Implementada função `handleChangePassword()` via Supabase Auth
- Adicionados ícones de mostrar/ocultar senha
- Validações: senha atual, mínimo 6 caracteres, senhas conferem

### Correção 4: Alterar Perfil
- **Arquivo**: `src/app/(dashboard)/settings/page.tsx`
- Implementada função `handleSaveProfile()` com update no banco
- Busca dados reais do usuário ao carregar
- Email é apenas leitura (não editável)
- Mensagens de sucesso/erro

### Correção 5: Mask de Telefone
- **Arquivo**: `src/app/(dashboard)/settings/page.tsx`
- Adicionada função `formatPhone()` para máscara brasileira
- Formato: (XX) XXXXX-XXXX para 11 dígitos
- Placeholder correto "(11) 99999-9999"
- Valor inicial vazio em vez de hardcoded

### Correção 6: Restrições por Plano
- **Arquivo**: `src/components/dashboard/shell.tsx`
- Corrigida lógica de `hasPermission()` para verificar plano primeiro
- Usuários no plano FREE têm acesso apenas:
  - Dashboard (leitura)
  - Clientes (leitura)
  - Empréstimos (leitura)
  - Pagamentos (escrita)

### Correção 8: Resumo da Conta
- **Arquivo**: `src/app/(dashboard)/settings/page.tsx`
- Busca dados reais do tenant (nome, plano)
- Exibe estatísticas reais de clientes e empréstimos
- Link para alterar plano

### Correção 9: Campo Ajuda
- **Arquivo**: `src/app/(dashboard)/settings/page.tsx`
- Link para documentação (https://docs.axioncred.com.br)
- Link para email de suporte (suporte@axioncred.com.br)
- Ambos com target="_blank" para abrir em nova aba

### Correção 10: Seleção de Plano
- **Arquivo**: `src/app/(dashboard)/settings/plan/page.tsx`
- Melhorada a experiência com confirmação antes de selecionar plano pago
- Mensagem mais clara indicando que é uma simulação

---

## ⚠️ CORREÇÃO PENDENTE

### Link de Verificação (localhost:3000)
Para corrigir o link de verificação que aponta para localhost:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** → **URL Configuration**
4. Em **Site URL**, adicione a URL de produção:
   - `https://work-1-phypkszrcdtqkrcd.prod-runtime.all-hands.dev/`
5. Clique em **Save**

Isso fará com que os emails de confirmação apontem para a URL correta em vez de localhost:3000.

---

## 📁 ARQUIVOS A ALTERAR

```
src/app/(auth)/register/page.tsx          - Adicionar campo empresa
src/lib/plans.ts                           - Sistema de permissões
src/contexts/auth-context.tsx              - Verificação de plano
src/components/dashboard/upgrade-banner.tsx - Banner de upgrade (CSS)
src/components/dashboard/shell.tsx         - Menu com permissões + ajuda
src/app/(dashboard)/settings/page.tsx      - Alterar senha/perfil
src/app/(dashboard)/settings/plan/page.tsx - Seleção de plano
```

---

## 🔧 DETALHES TÉCNICOS

### Sistema de Planos (plans.ts)
```typescript
// Planos existentes:
- free: only read dashboard, customers, loans + write payments
- starter (R$97): full customers, loans + write business_rules, payments, collections + read reports
- pro (R$197): full all except quick_sale, settings
- enterprise (R$497): full everything

// Função para verificar acesso:
hasModuleAccess(plan, module, requiredAccess)
```

### Verificação de Permissões no Menu (shell.tsx)
O menu já tem a estrutura de permissões, mas precisa aplicar corretamente.

### Campos do Usuário (users table)
```sql
- id, tenant_id, email, name, role
- avatar_url, is_active, status
- invite_token, invite_expires_at, invited_by
```

### Campos do Tenant
```sql
- id, name, document, phone, email
- address, city, state, zip_code
- logo_url, settings (JSONB), is_active
- plan (free/starter/pro/enterprise)
```

---

*Última atualização: 09/04/2026*
*Documento gerado após análise completa do sistema*