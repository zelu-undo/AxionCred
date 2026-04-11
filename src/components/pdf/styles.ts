import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// AXION Color Palette
// Note: We use the default PDF font (Helvetica) instead of custom fonts
// This avoids 404 errors on font URL loading
const colors = {
  primary: '#1E3A8A',      // Dark blue
  secondary: '#1E3A8A',    // Dark blue
  accent: '#22C55E',        // Green
  accentLight: '#4ADE80',  // Light green
  danger: '#EF4444',        // Red
  warning: '#F59E0B',       // Yellow/Orange
  text: '#111827',        // Black
  textLight: '#6B7280',   // Gray
  textMuted: '#9CA3AF',   // Light gray
  background: '#F9FAFB', // Off-white
  border: '#E5E7EB',     // Light border
  white: '#FFFFFF',
};

// Common styles
const baseStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.primary,
  },
  logoAccent: {
    color: colors.accent,
  },
  subtitle: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 11,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  rowValue: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 8,
    color: colors.textMuted,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 600,
    overflow: 'hidden',
  },
  contractNumber: {
    fontSize: 12,
    fontWeight: 600,
    color: '#22C55E',
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  tableCell: {
    fontSize: 9,
    color: colors.text,
  },
});

// Status badge helper
const getStatusStyles = (status: string) => {
  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: '#ECFDF5', color: '#059669', label: 'ATIVO' },
    paid: { bg: '#EFF6FF', color: '#2563EB', label: 'PAGO' },
    overdue: { bg: '#FEF2F2', color: '#DC2626', label: 'ATRASADO' },
    pending: { bg: '#FFFBEB', color: '#D97706', label: 'PENDENTE' },
    cancelled: { bg: '#F3F4F6', color: '#6B7280', label: 'CANCELADO' },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return {
    backgroundColor: config.bg,
    color: config.color,
  };
};

export { baseStyles, colors, getStatusStyles };
export default { baseStyles, colors, getStatusStyles };