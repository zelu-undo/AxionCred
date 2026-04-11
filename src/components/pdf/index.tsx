'use client';

import { useCallback, useState } from 'react';
import * as rpdf from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

// Helper to download PDF
export function usePDF() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = useCallback(async (
    // Document component (not instance)
    DocumentComponent: React.ComponentType<any>,
    data: Record<string, unknown>,
    filename: string
  ) => {
    setIsGenerating(true);
    try {
      // Verify document exists
      if (!DocumentComponent) {
        throw new Error('Componente de documento não fornecido');
      }

      console.log('Generating PDF with document:', DocumentComponent.name);
      console.log('PDF data:', data);

      // In react-pdf v4, pass data to Document props and use a render function
      // This is the correct pattern for react-pdf v4
      const pdfDocument = (
        <rpdf.Document data={data}>
          <DocumentComponent />
        </rpdf.Document>
      );

      // Use pdf() to create the PDF
      const pdfInstance = await pdf(pdfDocument).toBlob();
      
      const url = URL.createObjectURL(pdfInstance);
      
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
      let errorMessage = 'Erro ao gerar PDF';
      if (error instanceof Error) {
        errorMessage = error.message;
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
export { pdf as default } from '@react-pdf/renderer';
export * from './CustomerHistory';
export * from './Refinancing';
export * from './CashFlow';