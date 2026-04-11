'use client';

import { useCallback, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

// Helper to download PDF
export function usePDF() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = useCallback(async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document: any,
    filename: string
  ) => {
    setIsGenerating(true);
    try {
      // Verify document exists
      if (!document) {
        throw new Error('Documento não fornecido');
      }

      console.log('Generating PDF with document:', document?.type?.name || document?.constructor?.name);

      // Try to create PDF using react-pdf
      // For react-pdf v4, we need to pass the document directly to pdf()
      const pdfDoc = await pdf(document);
      const blob = await pdfDoc.toBlob();
      
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      showSuccessToast('PDF baixado com sucesso!');
    } catch (error) {
      console.error('PDF Error:', error);
      let errorMessage = 'Erro ao gerar PDF. Verifique se o documento está correto.';
      if (error instanceof Error) {
        errorMessage = `Erro: ${error.message}`;
      }
      showErrorToast(errorMessage);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generatePDF, isGenerating };
}

// Export helpers for each document type
export * from './LoanContract';
export { pdf } from '@react-pdf/renderer';
export * from './CustomerHistory';
export * from './Refinancing';
export * from './CashFlow';