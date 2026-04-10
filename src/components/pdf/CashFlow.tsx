'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { baseStyles, colors } from './styles';

// Register fonts
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCj7Z1xlFQ.woff2', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCj5Z1xlFQ.woff2', fontWeight: 700 },
  ],
});

// Styles
const styles = StyleSheet.create({
  ...baseStyles,
  dateRange: {
    fontSize: 10,
    color: colors.textLight,
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  summaryCard: {
    width: '23%',
    marginRight: '2%',
    marginBottom: 10,
    padding: 10,
    borderRadius: 6,
  },
  summaryCardLabel: {
    fontSize: 8,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryCardValue: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.white,
    marginTop: 4,
  },
  typeHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 15,
    marginBottom: 5,
  },
  typeHeaderText: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.white,
  },
  transactionRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  transactionCell: {
    fontSize: 9,
    color: colors.text,
  },
  categoryBadge: {
    fontSize: 8,
    fontWeight: 600,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 700,
  },
});

// Types
interface CashFlowData {
  generatedAt: string;
  filters: {
    tipo?: string;
    categoria?: string;
    dataInicio?: string;
    dataFim?: string;
  };
  summary: {
    saldo_atual: number;
    total_entradas: number;
    total_saidas: number;
    total_aportes: number;
    total_retiradas: number;
    total_emprestimos_liberados: number;
    total_pagamentos_recebidos: number;
    total_ajustes: number;
  };
  transactions: {
    tipo: string;
    categoria: string;
    valor: number;
    data_transacao: string;
    descricao: string;
    usuario_responsavel: string;
  }[];
}

// Main Document
const CashFlowDocument: React.FC<{ data: CashFlowData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            AX<Text style={styles.logoAccent}>ION</Text>
          </Text>
          <Text style={styles.subtitle}>Sistema de Gestão de Crédito</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>RELATÓRIO</Text>
          <Text style={styles.contractNumber}>Fluxo de Caixa</Text>
        </View>
      </View>

      {/* Filters Info */}
      <View style={styles.section}>
        <Text style={styles.dateRange}>
          {data.filters.dataInicio && data.filters.dataFim 
            ? `Período: ${data.filters.dataInicio} até ${data.filters.dataFim}`
            : data.filters.tipo 
            ? `Tipo: ${data.filters.tipo === 'entrada' ? 'Entradas' : 'Saídas'}`
            : 'Período completo'
          }
          {data.filters.categoria && ` | Categoria: ${data.filters.categoria}`}
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={{ ...styles.summaryCard, backgroundColor: colors.accent }}>
          <Text style={styles.summaryCardLabel}>Saldo Atual</Text>
          <Text style={styles.summaryCardValue}>
            R$ {data.summary.saldo_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={{ ...styles.summaryCard, backgroundColor: '#2563EB' }}>
          <Text style={styles.summaryCardLabel}>Total Entradas</Text>
          <Text style={styles.summaryCardValue}>
            R$ {data.summary.total_entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={{ ...styles.summaryCard, backgroundColor: colors.danger }}>
          <Text style={styles.summaryCardLabel}>Total Saídas</Text>
          <Text style={styles.summaryCardValue}>
            R$ {data.summary.total_saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={{ ...styles.summaryCard, backgroundColor: colors.primary }}>
          <Text style={styles.summaryCardLabel}>Transações</Text>
          <Text style={styles.summaryCardValue}>{data.transactions.length}</Text>
        </View>
      </View>

      {/* Transactions by Type */}
      {['entrada', 'saida'].map((tipo) => {
        const typeTransactions = data.transactions.filter(t => t.tipo === tipo);
        if (typeTransactions.length === 0) return null;
        
        return (
          <View key={tipo} style={styles.section}>
            <View style={{ 
              ...styles.typeHeader, 
              backgroundColor: tipo === 'entrada' ? '#059669' : '#DC2626' 
            }}>
              <Text style={styles.typeHeaderText}>
                {tipo === 'entrada' ? 'ENTRADAS' : 'SAÍDAS'}
              </Text>
            </View>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '20%' }]}>DATA</Text>
              <Text style={[styles.tableHeaderText, { width: '25%' }]}>CATEGORIA</Text>
              <Text style={[styles.tableHeaderText, { width: '30%' }]}>DESCRIÇÃO</Text>
              <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>VALOR</Text>
              <Text style={[styles.tableHeaderText, { width: '10%' }]}>RESP.</Text>
            </View>

            {typeTransactions.map((tx, idx) => (
              <View key={idx} style={styles.transactionRow}>
                <Text style={{ ...styles.transactionCell, width: '20%' }}>{tx.data_transacao}</Text>
                <Text style={{ 
                  ...styles.transactionCell, 
                  width: '25%',
                  fontSize: 8,
                  color: colors.textMuted,
                }}>{tx.categoria}</Text>
                <Text style={{ ...styles.transactionCell, width: '30%' }}>{tx.descricao}</Text>
                <Text style={{ 
                  ...styles.transactionCell, 
                  width: '15%', 
                  textAlign: 'right',
                  fontWeight: 500,
                }}>
                  R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={{ ...styles.transactionCell, width: '10%', fontSize: 8 }}>{tx.usuario_responsavel}</Text>
              </View>
            ))}
          </View>
        );
      })}

      {/* Totals */}
      <View style={styles.totalSection}>
        <View>
          <Text style={styles.totalLabel}>Total Entradas</Text>
          <Text style={{ ...styles.totalValue, color: '#059669' }}>
            R$ {data.summary.total_entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View>
          <Text style={styles.totalLabel}>Total Saídas</Text>
          <Text style={{ ...styles.totalValue, color: '#DC2626' }}>
            R$ {data.summary.total_saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View>
          <Text style={styles.totalLabel}>Saldo Final</Text>
          <Text style={{ 
            ...styles.totalValue, 
            color: data.summary.saldo_atual >= 0 ? colors.accent : colors.danger 
          }}>
            R$ {data.summary.saldo_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Documento gerado pelo sistema AXION Cred</Text>
        <Text style={styles.footerText}>Gerado em: {data.generatedAt}</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} />
      </View>
    </Page>
  </Document>
);

export default CashFlowDocument;
export { CashFlowDocument };