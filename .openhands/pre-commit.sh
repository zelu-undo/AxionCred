#!/bin/bash

# ============================================
# AXION Cred - Pre-commit Hook
# Executa verificações antes de cada commit
# ============================================

set -e

echo "🔍 Executando verificações de código..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 1. Verificar TypeScript e ESLint
# ============================================
echo ""
echo "📋 Verificando ESLint..."

cd /workspace/project/AxionCred

if npm run lint 2>&1; then
    echo -e "${GREEN}✓ ESLint passou${NC}"
else
    echo -e "${RED}✗ ESLint encontrou problemas. Corrija antes de fazer commit.${NC}"
    exit 1
fi

# ============================================
# 2. Executar Testes Unitários
# ============================================
echo ""
echo "🧪 Executando testes unitários..."

if npm test 2>&1; then
    echo -e "${GREEN}✓ Todos os testes passaram${NC}"
else
    echo -e "${RED}✗ Testes falharam. Corrija os testes antes de fazer commit.${NC}"
    exit 1
fi

# ============================================
# 3. Verificar Build
# ============================================
echo ""
echo "🏗️ Verificando build..."

if npm run build 2>&1; then
    echo -e "${GREEN}✓ Build passou${NC}"
else
    echo -e "${RED}✗ Build falhou. Corrija os erros de build antes de fazer commit.${NC}"
    exit 1
fi

# ============================================
# Verificação Concluída
# ============================================
echo ""
echo -e "${GREEN}🎉 Todas as verificações passaram!${NC}"
echo ""
echo "Resumo:"
echo "  ✓ ESLint"
echo "  ✓ Testes Unitários (72 testes)"
echo "  ✓ Build"
echo ""

exit 0
