# 🧪 GUIA COMPLETO DE TESTES - AXION Cred

> Versão: 3.0  
> Data: 09/04/2026  
> Objetivo: Testar todas as funcionalidades do sistema

---

## 📋 ACESSO AO SISTEMA

### Credenciais de Teste
- **URL**: https://work-1-phypkszrcdtqkrcd.prod-runtime.all-hands.dev/
- **Portal Admin**: https://work-2-phypkszrcdtqkrcd.prod-runtime.all-hands.dev/

### Fluxo de Login
1. Acesse a URL principal
2. Use email e senha cadastrados
3. Se novo usuário, faça registro em `/register`

---

## 🔐 AUTENTICAÇÃO

### Testes de Autenticação

| # | Funcionalidade | Como Testar | Resultado Esperado |
|---|----------------|-------------|-------------------|
| 1 | Login com email válido | Entrar com credenciais existentes | Redirecionado para /dashboard |
| 2 | Login com senha errada | Digitar senha incorreta | Mensagem de erro |
| 3 | Registro de novo usuário | Acessar /register e preencher | Criação de conta |
| 4 | Logout | Clicar em "Sair" | Redirecionado para login |
| 5 | Sessão expirada | Fechar aba e reopen | Redirect para login |

### Itens a Verificar
- [ ] Redirect automático para /login se não autenticado
- [ ] Redirect para /dashboard se já logado e acessar /login
- [ ] Cache de verificação de sessão (5 segundos)
- [ ] Sincronização entre abas (logout em uma reflete em todas)

---

## 📊 DASHBOARD

### Testes do Dashboard

| # | Funcionalidade | Como Testar | Resultado Esperado |
|---|----------------|-------------|-------------------|
| 1 | Cards de estatísticas | Verificar dados exibidos | Números corretos |
| 2 | Gráfico de recebimentos | Acessar dashboard | Gráfico renderiza |
| 3 | Lista de recentes | Verificar últimos itens | Lista populada |
| 4 | Menu lateral | Navegar entre páginas | Menu funcional |
| 5 | Busca global | Pressionar Ctrl+K | Modal de busca abre |

### Itens a Verificar
- [ ] Sidebar sempre visível (não some)
- [ ] Cards com dados realistas
- [ ] Navegação fluida entre páginas
- [ ] Animações de transição (Framer Motion)
- [ ] Responsividade em diferentes tamanhos

---

## 👥 CLIENTES (Customers)

### Testes de Clientes

| # | Funcionalidade | Como Testar | Resultado Esperado |
|---|----------------|-------------|-------------------|
| 1 | Lista de clientes | Acessar /customers | Grid/listagem carrega |
| 2 | Busca de clientes | Digitar nome na busca | Lista filtra em tempo real |
| 3 | Criar cliente | Clicar "Novo Cliente" | Modal de criação abre |
| 4 | Editar cliente | Clicar em cliente → editar | Campos editáveis |
| 5 | Deletar cliente | Clicar em excluir | Confirmação + exclusão |
| 6 | Histórico PDF | Clicar botão "PDF" | PDF baixa com dados |

### Dados do Cliente
- Nome, email, telefone, CPF/CNPJ
- Endereço completo (CEP, rua, número, complemento, bairro, cidade, estado)
- Limite de crédito
- Status (ativo/inativo)
- Score/scoring
- Segmento
- Observações

### Itens a Verificar
- [ ] Validação de CPF (formato e dígitos)
- [ ] Busca via CEP funciona
- [ ] Status atualiza corretamente
- [ ] Link para detalhamento funciona

---

## 💰 EMPRÉSTIMOS (Loans)

### Testes de Empréstimos

| # | Funcionalidade | Como Testar | Resultado Esperado |
|---|----------------|-------------|-------------------|
| 1 | Lista de empréstimos | Acessar /loans | Listagem carrega |
| 2 | Criar empréstimo | Clicar "Novo Empréstimo" | Formulário abre |
| 3 | Visualizar detalhes | Clicar em um empréstimo | Página de detalhes |
| 4 | Lista de parcelas | Ver na página de detalhes | Parcelas listadas |
| 5 | Baixar contrato PDF | Clicar "Baixar PDF" | PDF baixa |
| 6 | Cancelar empréstimo | Ações → Cancelar | Confirmação + ação |

### Fluxo de Criação
1. Selecionar cliente
2. Definir valor principal
3. Definir número de parcelas
4. Definir data do primeiro vencimento
5. Definir taxa de juros
6. Revisar e confirmar

### Itens a Verificar
- [ ] Cálculo automático de total com juros
- [ ] Geração correta de parcelas
- [ ] Status atualizado (ativo/pago/atrasado)
- [ ] Link para cliente associado

---

## 💵 CAIXA (Cash)

### Testes do Caixa

| # | Funcionalidade | Como Testar | Resultado Esperado |
|---|----------------|-------------|-------------------|
| 1 | Saldo atual | Acessar /cash | Saldo exibido |
| 2 | Registro de aporte | Clicar "Novo Aporte" | Modal abre |
| 3 | Registro de retirada | Clicar "Nova Retirada" | Modal abre |
| 4 | Lista de transações | Ver listagem | Transações listadas |
| 5 | Filtros | Usar filtros (tipo, categoria, data) | Lista filtra |
| 6 | Gerar PDF com filtros | Clicar "PDF" | PDF com filtros |

### Tipos de Transação
- **Entradas**: Aporte, Pagamento Recebido, Ajuste Positivo
- **Saídas**: Empréstimo Liberado, Retirada, Ajuste Negativo

### Itens a Verificar
- [ ] Saldo atualiza em tempo real
- [ ] Filtros funcionam corretamente
- [ ] PDF inclui filtros ativos
- [ ] Histórico com data/hora

---

## 🔄 RENEGOCIAÇÕES (Refinancing)

### Testes de Renegociação

| # | Funcionalidade | Como Testar | Resultado Esperado |
|---|----------------|-------------|-------------------|
| 1 | Lista de renegociacões | Acessar /renegotiations | Lista carrega |
| 2 | Criar renegociacão | Clicar "Nova Renego" | Formulário abre |
| 3 | Selecionar cliente/empréstimo | Escolher na lista | Dados carregam |
| 4 | Definir novos termos | Valor, parcelas, juros | Cálculos atualizam |
| 5 | Aprovar/Rejeitar | Usar botões de ação | Status altera |
| 6 | Baixar PDF | Clicar "PDF" | PDF baixa |

### Fluxo de Renegociação
1. Selecionar cliente com empréstimo ativo
2. Escolher empréstimo para renegociar
3. Definir novo valor total
4. Definir novas parcelas e taxa
5. Adicionar observações (opcional)
6. Salvar (status: Pendente)
7. Aprovar ou Rejeitar

### Itens a Verificar
- [ ] Comparativo original vs novo exibido
- [ ] Status atualiza corretamente
- [ ] PDF com todos os dados

---

## 📈 RELATÓRIOS (Reports)

### Testes de Relatórios

| # | Funcionalidade | Como Testar | Resultado Esperado |
|---|----------------|-------------|-------------------|
| 1 | Relatório de clientes | Acessar /reports | Dados carregam |
| 2 | Filtros | Aplicar filtros | Dados filtram |
| 3 | Download | Clicar em exportar | Download inicia |
| 4 | Fluxo de caixa | Acessar /reports/cash-flow | Gráficos exibem |
| 5 | Relatórios financeiros | Acessar /reports/financial | Dados carregam |

### Itens a Verificar
- [ ] Gráficos renderizam corretamente
- [ ] Dados准确性
- [ ] Exportação funciona

---

## ⚙️ CONFIGURAÇÕES (Settings)

### Testes de Configurações

| # | Módulo | Funcionalidade |
|---|--------|----------------|
| 1 | Geral | Configurações da empresa |
| 2 | Plano | Ver plano atual e upgrades |
| 3 | Usuários | Gerenciar staff |
| 4 | Funções | Permissões por perfil |
| 5 | Regras de Crédito | Limites e taxas |
| 6 | LGPD | Política de privacidade |
| 7 | Notificações | Templates de email/SMS |
| 8 | Lembretes | Automação de cobranças |
| 9 | Audit Log | Histórico de ações |

### Itens a Verificar
- [ ] Cada módulo carrega
- [ ] Dados salvam corretamente
- [ ] Permissões aplicadas

---

## 🔒 ADMIN / SUPER-ADMIN

### Portal Admin
- **URL**: https://work-2-phypkszrcdtqkrcd.prod-runtime.all-hands.dev/
- Acesso para super-admin ver todas as empresas

### Funcionalidades Admin
- Lista de empresas/tenants
- Estatísticas globais
- Cleanup de dados órfãos
- Gestão de planos

### Itens a Verificar
- [ ] Dashboard admin carrega
- [ ] Estatísticas corretas
- [ ] Cleanup funciona

---

## 🧪 GERAÇÃO DE PDFs

### Testes de PDF

| # | Página | Template | Verificar |
|---|--------|----------|-----------|
| 1 | /loans/[id] | LoanContract | Contrato completo |
| 2 | /customers/[id] | CustomerHistory | Histórico do cliente |
| 3 | /cash | CashFlow | Fluxo com filtros |
| 4 | /renegotiations | Refinancing | Proposta de renego |

### Elementos do PDF
- [ ] Logo AXION com branding
- [ ] Cores corretas (azul #1E3A8A, verde #22C55E)
- [ ] Fonte Poppins
- [ ] Dados completos e formatados
- [ ] Tabelas legíveis
- [ ] Totais calculados
- [ ] Numeração de páginas

---

## 🐛 PROBLEMAS CONHECIDOS (A serem corrigidos)

### Issues Já Corrigidos (v2.0 - 09/04/2026)
1. ✅ Select dropdown aparece atrás do modal - corrigido com `position="item-aligned"`
2. ✅ Banner "Plano Gratuito" deslocando layout - corrigido para `fixed`
3. ✅ Sidebar visibility - corrigido para sempre visível
4. ✅ Super Admin criado em `/super-admin`
5. ✅ Alterar senha implementado
6. ✅ Campo "Nome da Empresa" no registro
7. ✅ PDF Generation implementado em 4 páginas

### Issues Pendentes
1. ⏳ Link de verificação email (precisa configurar NEXT_PUBLIC_APP_URL no Supabase)
2. ⏳ Acesso sem restrições de plano (parcial - revisão necessária)
3. ⏳ Campo "Ajuda" não funciona

---

## ✅ CHECKLIST FINAL DE TESTES

### Autenticação
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Registro funciona
- [ ] Sessão persiste

### Navegação
- [ ] Menu lateral funciona
- [ ] Busca global funciona
- [ ] Todas as páginas acessíveis

### Dados
- [ ] Clientes CRUD
- [ ] Empréstimos CRUD
- [ ] Caixa transações
- [ ] Renegociacões

### Relatórios
- [ ] Relatórios carregam
- [ ] Gráficos exibem
- [ ] PDFs geram corretamente

### UI/UX
- [ ] Design responsivo
- [ ] Animações suaves
- [ ] Cores AXION aplicadas
- [ ] Tipografia Poppins

---

## 🔗 URLS DE ACESSO

### Ambiente de Produção
| Serviço | URL | Porta |
|---------|-----|-------|
| **Aplicação Principal** | https://work-1-phypkszrcdtqkrcd.prod-runtime.all-hands.dev | 12000 |
| **Portal Admin/Super-Admin** | https://work-2-phypkszrcdtqkrcd.prod-runtime.all-hands.dev | 12001 |

### Credenciais de Teste
> ⚠️ **Nota**: Use a página de registro em `/register` para criar novos usuários de teste.

---

## 🎨 DESIGN SYSTEM AXION

### Cores Oficiais
| Cor | Hex | Uso |
|-----|-----|-----|
| Azul Principal | `#1E3A8A` | Fundos, cards, elementos estruturais |
| Verde Principal | `#22C55E` | Botões primários, ações positivas |
| Verde Neon | `#4ADE80` | Hover, brilho, microinterações |
| Vermelho (Alerta) | `#EF4444` | Status atraso, erros |
| Amarelo (Atenção) | `#F59E0B` | Alertas moderados |
| Cinza Escuro | `#374151` | Textos secundários |
| Branco | `#FFFFFF` | Texto principal em fundos escuros |
| Preto | `#111827` | Fundo alternativo |

### Tipografia
- **Fonte**: Poppins (Google Fonts)
- **Títulos**: Bold (700), 32px+
- **Subtítulos**: SemiBold (600), 20-24px
- **Corpo**: Regular (400), 16px
- **Labels**: Medium (500), 14-16px

### Ícones
- **Estilo**: Outline (traço), 1.5px-2px
- **Tamanhos**: 20px (interface), 24px (botões), 32px (ilustrações)
- **Biblioteca**: Lucide React

---

## 📝 RELATÓRIO DE BUGS

Use este formato para reportar bugs:

```
## Bug Report

**Data**: __/__/2026
**Página**: 
**Funcionalidade**: 
**Passos para reproduzir**:
1. 
2. 
3. 

**Resultado esperado**: 
**Resultado real**: 

**Screenshot**: 
```

---

> 💡 **Dica**: Execute os testes em ordem: Login → Dashboard → Clientes → Empréstimos → Caixa → Relatórios → Configurações