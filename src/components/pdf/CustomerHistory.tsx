'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { baseStyles, colors } from './styles';

// Register fonts

// Styles
const styles = StyleSheet.create({
  ...baseStyles,
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  infoBox: {
    width: '48%',
    marginBottom: 12,
    marginRight: '2%',
  },
  valueLarge: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.text,
  },
  loanCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  loanNumber: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.primary,
  },
  loanStatus: {
    fontSize: 9,
    fontWeight: 600,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  loanDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loanDetail: {
    width: '45%',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 15,
  },
});

// Types
interface CustomerHistoryData {
  customer: {
    name: string;
    document: string;
    email: string;
    phone: string;
    address?: string;
    createdAt: string;
  };
  summary: {
    totalLoans: number;
    activeLoans: number;
    paidLoans: number;
    totalValue: number;
    totalPaid: number;
    totalPending: number;
  };
  loans: {
    contractNumber: string;
    createdAt: string;
    status: string;
    amount: number;
    installmentValue: number;
    installmentCount: number;
    installmentsPaid: number;
  }[];
}

// Main Document Component
const CustomerHistoryDocument: React.FC<{ data: CustomerHistoryData }> = ({ data }) => (
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
          <Text style={styles.contractNumber}>Histórico do Cliente</Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Cliente</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.label}>NOME COMPLETO</Text>
            <Text style={styles.value}>{data.customer.name}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>DOCUMENTO (CPF)</Text>
            <Text style={styles.value}>{data.customer.document}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>E-MAIL</Text>
            <Text style={styles.value}>{data.customer.email}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>TELEFONE</Text>
            <Text style={styles.value}>{data.customer.phone}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>ENDEREÇO</Text>
            <Text style={styles.value}>{data.customer.address || 'Não informado'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>CLIENTE DESDE</Text>
            <Text style={styles.value}>{data.customer.createdAt}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total de Contratos</Text>
            <Text style={styles.summaryValue}>{data.summary.totalLoans}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Contratos Ativos</Text>
            <Text style={{ ...styles.summaryValue, color: colors.accent }}>{data.summary.activeLoans}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Contratos Pagos</Text>
            <Text style={{ ...styles.summaryValue, color: '#2563EB' }}>{data.summary.paidLoans}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor Total Liberado</Text>
            <Text style={styles.summaryValue}>
              R$ {data.summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor Já Pago</Text>
            <Text style={{ ...styles.summaryValue, color: '#059669' }}>
              R$ {data.summary.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor Pendente</Text>
            <Text style={{ ...styles.summaryValue, color: '#D97706' }}>
              R$ {data.summary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* Loans List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Histórico de Contratos</Text>
        
        {/* Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '20%' }]}>Contrato</Text>
          <Text style={[styles.tableHeaderText, { width: '25%' }]}>Data</Text>
          <Text style={[styles.tableHeaderText, { width: '20%' }]}>Valor</Text>
          <Text style={[styles.tableHeaderText, { width: '15%' }]}>Parcelas</Text>
          <Text style={[styles.tableHeaderText, { width: '20%' }]}>Status</Text>
        </View>

        {data.loans.map((loan) => (
          <View key={loan.contractNumber} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '20%', fontWeight: 600 }]}>{loan.contractNumber}</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{loan.createdAt}</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>
              R$ {loan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>{loan.installmentsPaid}/{loan.installmentCount}</Text>
            <Text style={[styles.tableCell, { width: '20%', fontWeight: 600 }]}>
              {loan.status === 'paid' ? 'PAGO' : loan.status === 'active' ? 'ATIVO' : 'ATRASADO'}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Documento gerado pelo sistema AXION Cred</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} />
      </View>
    </Page>
  </Document>
);

export default CustomerHistoryDocument;
export { CustomerHistoryDocument };