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
  contractNumber: string;
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
          <Text style={styles.label}>CONTRATO Nº</Text>
          <Text style={styles.contractNumber}>{data.contractNumber}</Text>
        </View>
      </View>

      {/* Contract Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Contrato</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.label}>DATA DE CRIAÇÃO</Text>
            <Text style={styles.value}>{data.createdAt}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>STATUS</Text>
            <View style={{
              backgroundColor: data.status === 'active' ? '#ECFDF5' : '#F3F4F6',
              color: data.status === 'active' ? '#059669' : '#6B7280',
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4
            }}>
              <Text style={{ fontSize: 10, fontWeight: 600 }}>
                {data.status === 'active' ? 'ATIVO' : 'INATIVO'}
              </Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>VALOR EMPRESTADO</Text>
            <Text style={styles.valueLarge}>
              R$ {data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>TAXA DE JUROS</Text>
            <Text style={styles.valueLarge}>{data.interestRate}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

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

      {/* Installments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parcelas ({data.paidInstallments}/{data.totalInstallments})</Text>
        
        {/* Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '15%' }]}>Nº</Text>
          <Text style={[styles.tableHeaderText, { width: '30%' }]}>VENCIMENTO</Text>
          <Text style={[styles.tableHeaderText, { width: '25%' }]}>VALOR</Text>
          <Text style={[styles.tableHeaderText, { width: '30%' }]}>STATUS</Text>
        </View>

        {/* Installments */}
        {data.installments.map((inst) => (
          <View key={inst.number} style={styles.tableRow}>
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

      {/* Summary */}
      <View style={{ ...styles.section, marginTop: 20 }}>
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.label}>VALOR DA PARCELA</Text>
            <Text style={styles.valueLarge}>
              R$ {data.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>TOTAL A PAGAR</Text>
            <Text style={styles.valueLarge}>
              R$ {data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
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

export default LoanContractDocument;
export { LoanContractDocument };