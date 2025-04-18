
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFService {
  async generatePDF(articleData: {
    number: string;
    content: string;
    lawTitle: string;
    explanation: string;
    example: string;
  }): Promise<string> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let y = 20;

      // Header and title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`VADE MECUM PRO - ${articleData.lawTitle}`, margin, y);
      y += 10;

      // Artigo
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${articleData.number}`, margin, y);
      y += 10;

      // Conteúdo do artigo
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const splitContent = pdf.splitTextToSize(articleData.content, contentWidth);
      pdf.text(splitContent, margin, y);
      y += splitContent.length * 7 + 10;

      // Explicação
      if (articleData.explanation) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Explicação', margin, y);
        y += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const splitExplanation = pdf.splitTextToSize(articleData.explanation, contentWidth);
        pdf.text(splitExplanation, margin, y);
        y += splitExplanation.length * 7 + 10;
      }

      // Exemplo prático
      if (articleData.example) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Exemplo Prático', margin, y);
        y += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const splitExample = pdf.splitTextToSize(articleData.example, contentWidth);
        pdf.text(splitExample, margin, y);
      }

      // Adicionar rodapé
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(
          `VADE MECUM PRO - Página ${i} de ${totalPages} - Gerado em ${new Date().toLocaleDateString()}`,
          margin,
          pdf.internal.pageSize.getHeight() - 10
        );
      }

      // Simular o upload para o Google Drive e geração de link
      // Aqui seria a implementação real da API do Google Drive
      const pdfData = pdf.output('datauristring');
      console.log('PDF gerado com sucesso');
      
      // Simulando um link temporário (7 dias)
      const randomId = Math.random().toString(36).substring(2, 15);
      const tempLink = `https://drive.google.com/file/d/${randomId}/view?usp=sharing`;
      
      return tempLink;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Não foi possível gerar o PDF');
    }
  }
}

export const pdfService = new PDFService();
export default pdfService;
