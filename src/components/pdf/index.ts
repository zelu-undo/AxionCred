'use client';

import type { ReactElement } from 'react';
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
      // Create PDF document
      const pdfDoc = pdf(document);
      
      // Generate blob with timeout
      const blob = await Promise.race([
        pdfDoc.toBlob(),
        new Promise<Blob>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao gerar PDF')), 30000)
        )
      ]);
      
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
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
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