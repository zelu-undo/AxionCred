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
  contractNumber: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.warning,
    marginTop: 4,
  },
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
  infoBoxFull: {
    width: '100%',
    marginBottom: 12,
  },
  valueLarge: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    marginTop: 4,
  },
  comparisonTable: {
    marginTop: 15,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  comparisonLabel: {
    width: '40%',
    fontSize: 10,
    color: colors.textLight,
    paddingLeft: 10,
  },
  comparisonOld: {
    width: '30%',
    fontSize: 10,
    color: colors.danger,
    textDecoration: 'line-through',
    paddingLeft: 10,
  },
  comparisonNew: {
    width: '30%',
    fontSize: 10,
    fontWeight: 600,
    color: colors.accent,
    paddingLeft: 10,
  },
  comparisonHeader: {
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardRowLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  cardRowValue: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.text,
  },
  highlight: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
});

// Types
interface RefinancingData {
  renegotiationNumber: string;
  createdAt: string;
  status: string;
  // Original loan
  originalLoan: {
    contractNumber: string;
    amount: number;
    installmentValue: number;
    remainingValue: number;
    installmentsRemaining: number;
  };
  // New terms
  newLoan: {
    contractNumber: string;
    amount: number;
    interestRate: number;
    installmentValue: number;
    totalInstallments: number;
    totalValue: number;
  };
  // Customer
  customer: {
    name: string;
    document: string;
    email: string;
    phone: string;
  };
}

// Main Document Component
const RefinancingDocument: React.FC<{ data: RefinancingData }> = ({ data }) => (
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
          <Text style={styles.label}>REFINANCIAMENTO Nº</Text>
          <Text style={styles.contractNumber}>{data.renegotiationNumber}</Text>
        </View>
      </View>

      {/* Status Banner */}
      <View style={{ 
        backgroundColor: data.status === 'approved' ? '#ECFDF5' : '#FFFBEB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}>
        <Text style={{
          fontSize: 11,
          fontWeight: 600,
          color: data.status === 'approved' ? '#059669' : '#D97706',
        }}>
          {data.status === 'approved' ? '✓ APROVADO' : '⏳ PENDENTE'}
        </Text>
        <Text style={{ fontSize: 10, color: colors.textLight }}>
          Data: {data.createdAt}
        </Text>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Cliente</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.label}>NOME</Text>
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
        </View>
      </View>

      <View style={styles.divider} />

      {/* Original Loan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Empréstimo Original</Text>
        <View style={styles.infoCard}>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Contrato Original</Text>
            <Text style={{ ...styles.cardRowValue, color: colors.danger }}>
              {data.originalLoan.contractNumber}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Valor Original</Text>
            <Text style={styles.cardRowValue}>
              R$ {data.originalLoan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Valor Parcela</Text>
            <Text style={styles.cardRowValue}>
              R$ {data.originalLoan.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={{ ...styles.cardRow, borderBottomWidth: 0 }}>
            <Text style={styles.cardRowLabel}>Valor Restante</Text>
            <Text style={{ ...styles.cardRowValue, color: colors.danger }}>
              R$ {data.originalLoan.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* New Loan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nova Proposta</Text>
        <View style={{ ...styles.infoCard, backgroundColor: '#F0FDF4', borderColor: colors.accent }}>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Novo Contrato</Text>
            <Text style={{ ...styles.cardRowValue, color: colors.accent, fontWeight: 700 }}>
              {data.newLoan.contractNumber}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Valor do Refinanciamento</Text>
            <Text style={{ ...styles.cardRowValue, fontSize: 12, fontWeight: 700, color: colors.primary }}>
              R$ {data.newLoan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Taxa de Juros</Text>
            <Text style={styles.cardRowValue}>{data.newLoan.interestRate}%</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Nova Parcela</Text>
            <Text style={{ ...styles.cardRowValue, fontSize: 12, fontWeight: 700, color: colors.accent }}>
              R$ {data.newLoan.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={{ ...styles.cardRow, borderBottomWidth: 0 }}>
            <Text style={styles.cardRowLabel}>Total de Parcelas</Text>
            <Text style={styles.cardRowValue}>{data.newLoan.totalInstallments}x</Text>
          </View>
        </View>
      </View>

      {/* Comparison */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comparativo</Text>
        <View style={styles.comparisonTable}>
          <View style={{ ...styles.comparisonRow, ...styles.comparisonHeader }}>
            <Text style={[styles.tableHeaderText, { width: '40%', paddingLeft: 10 }]}>Descrição</Text>
            <Text style={[styles.tableHeaderText, { width: '30%', paddingLeft: 10 }]}>Anterior</Text>
            <Text style={[styles.tableHeaderText, { width: '30%', paddingLeft: 10 }]}>Novo</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={{ ...styles.tableCell, width: '40%' }}>Parcela Mensal</Text>
            <Text style={{ ...styles.tableCell, width: '30%', textDecoration: 'line-through', color: colors.danger }}>
              R$ {data.originalLoan.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={{ ...styles.tableCell, width: '30%', fontWeight: 600, color: colors.accent }}>
              R$ {data.newLoan.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={{ ...styles.tableCell, width: '40%' }}>Total a Pagar</Text>
            <Text style={{ ...styles.tableCell, width: '30%', color: colors.textLight }}>
              R$ {(data.originalLoan.remainingValue + (data.originalLoan.installmentValue * data.originalLoan.installmentsRemaining)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={{ ...styles.tableCell, width: '30%', fontWeight: 600, color: colors.primary }}>
              R$ {data.newLoan.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
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

export default RefinancingDocument;
export { RefinancingDocument };