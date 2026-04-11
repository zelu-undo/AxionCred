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
      // Verify document is a valid react-pdf document
      if (!document || typeof document !== 'object') {
        throw new Error('Documento inválido');
      }
      
      // Create PDF document - use pdf() function directly from react-pdf
      const pdfDoc = pdf(document);
      
      // Generate blob
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
      console.error('Error generating PDF:', error);
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
        // Check for specific errors
        if (error.message.includes('createElement')) {
          errorMessage = 'Erro ao criar documento PDF. Verifique os dados.';
        }
      }
      showErrorToast(`Erro ao gerar PDF: ${errorMessage}`);
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