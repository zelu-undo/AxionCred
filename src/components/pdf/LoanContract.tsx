'use client';

// LoanContract PDF Document
// This is the main contract document component

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { baseStyles, colors } from './styles';

// Styles for this document
const styles = StyleSheet.create({
  ...baseStyles,
  contractNumber: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.accent,
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
    fontSize: 20,
    fontWeight: 700,
    color: colors.primary,
    marginTop: 4,
  },
  installmentCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  installmentNumber: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.primary,
  },
  installmentStatus: {
    fontSize: 9,
    fontWeight: 600,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  installmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  signatureLine: {
    marginTop: 50,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signatureText: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
  },
  termsList: {
    marginTop: 8,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  termNumber: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.accent,
    width: 20,
  },
  termText: {
    fontSize: 9,
    color: colors.textLight,
    flex: 1,
    lineHeight: 1.4,
  },
});

// Types
interface LoanPDFData {
  contractTitle: string;
  createdAt: string;
  status: string;
  amount: number;
  interestRate: number;
  installmentValue: number;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  totalValue: number;
  customer: {
    name: string;
    document: string;
    email: string;
    phone: string;
  };
  installments: {
    number: number;
    dueDate: string;
    value: number;
    status: 'paid' | 'pending' | 'overdue';
    paidAt?: string;
  }[];
  generatedAt: string;
  generatedBy: string;
}

// Main Document Component
const LoanContractDocument: React.FC<{ data: LoanPDFData }> = ({ data }) => (
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
          <Text style={styles.label}>CONTRATO</Text>
          <Text style={styles.contractNumber}>{data.contractTitle}</Text>
        </View>
      </View>

      {/* Customer Info - FIRST */}
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

      {/* Contract Info - Only total value - AFTER customer */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Contrato</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoBoxFull}>
            <Text style={styles.label}>VALOR TOTAL</Text>
            <Text style={styles.valueLarge}>
              R$ {data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Summary - Before installments */}
      <View style={styles.section}>
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.label}>VALOR DA PARCELA</Text>
            <Text style={styles.valueLarge}>
              R$ {data.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>TOTAL DE PARCELAS</Text>
            <Text style={styles.valueLarge}>{data.totalInstallments}x</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>PARCELAS PAGAS</Text>
            <Text style={styles.valueLarge}>{data.paidInstallments}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>PARCELAS RESTANTES</Text>
            <Text style={styles.valueLarge}>{data.remainingInstallments}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Installments - At the end - with break-before to avoid cutting */}
      <View style={{ ...styles.section, marginBottom: 40 }}>
        <Text style={styles.sectionTitle}>Parcelas ({data.paidInstallments}/{data.totalInstallments})</Text>
        
        {/* Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '15%' }]}>Nº</Text>
          <Text style={[styles.tableHeaderText, { width: '30%' }]}>VENCIMENTO</Text>
          <Text style={[styles.tableHeaderText, { width: '25%' }]}>VALOR</Text>
          <Text style={[styles.tableHeaderText, { width: '30%' }]}>STATUS</Text>
        </View>

        {/* Installments - wrap each row to prevent page break in middle */}
        {data.installments.map((inst) => (
          <View key={inst.number} style={{ ...styles.tableRow, breakInsideAvoid: 'avoid' }}>
            <Text style={[styles.tableCell, { width: '15%' }]}>{inst.number}</Text>
            <Text style={[styles.tableCell, { width: '30%' }]}>{inst.dueDate}</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>
              R$ {inst.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.tableCell, { width: '30%' }]}>
              <Text style={{
                fontSize: 9,
                fontWeight: 600,
                color: inst.status === 'paid' ? '#059669' : inst.status === 'overdue' ? '#DC2626' : '#D97706',
              }}>
                {inst.status === 'paid' ? 'PAGO' : inst.status === 'overdue' ? 'ATRASADO' : 'PENDENTE'}
              </Text>
            </Text>
          </View>
        ))}
      </View>

      {/* Footer with creation date and generated by */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Documento gerado em {data.generatedAt} por {data.generatedBy}
        </Text>
      </View>

      {/* Footer with page numbers */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Documento gerado pelo sistema AXION Cred</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} />
      </View>
    </Page>
  </Document>
);

export default LoanContractDocument;
export { LoanContractDocument };