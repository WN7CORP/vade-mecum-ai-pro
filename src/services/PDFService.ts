
import jsPDF from 'jspdf';

interface ArticleData {
  number: string;
  content: string;
  lawTitle: string;
  explanation?: string;
  example?: string;
  technicalExplanation?: string;
  simpleExplanation?: string;
}

class PDFService {
  async generatePDF(articleData: ArticleData): Promise<string> {
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
      pdf.text(`${articleData.number}`, margin, y);
      y += 10;

      // Conteúdo
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const splitContent = pdf.splitTextToSize(articleData.content, contentWidth);
      pdf.text(splitContent, margin, y);
      y += splitContent.length * 7 + 10;

      // Explicação Técnica
      if (articleData.technicalExplanation) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Explicação Técnica', margin, y);
        y += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const splitTechnical = pdf.splitTextToSize(articleData.technicalExplanation, contentWidth);
        pdf.text(splitTechnical, margin, y);
        y += splitTechnical.length * 7 + 10;
      }

      // Explicação Simplificada
      if (articleData.simpleExplanation) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Explicação Simplificada', margin, y);
        y += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const splitSimple = pdf.splitTextToSize(articleData.simpleExplanation, contentWidth);
        pdf.text(splitSimple, margin, y);
        y += splitSimple.length * 7 + 10;
      }

      // Exemplo Prático
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

      // Add footer
      const totalPages = Object.keys(pdf.internal.pages).length - 1;
      for(let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(`VADE MECUM PRO - Página ${i} de ${totalPages} - Gerado em ${new Date().toLocaleDateString()}`, margin, pdf.internal.pageSize.getHeight() - 10);
      }

      const pdfData = pdf.output('datauristring');
      console.log('PDF gerado com sucesso');
      
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
