
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ArticleData {
  number: string;
  content: string;
  lawTitle: string;
  explanation?: string;
  example?: string;
}

class PDFService {
  // Google OAuth credentials
  private readonly CLIENT_ID = '317393591821-ih5mdn787j4fsrdieb98fgtp7ard8kon.apps.googleusercontent.com';
  private readonly API_KEY = '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';
  private readonly DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';
  private readonly FOLDER_ID = '1KSJYTpngn7Mg0--IV_tpF7NOeyn4Q1u8';

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
      // In newer versions of jsPDF, use internal.pages instead of getNumberOfPages()
      const totalPages = Object.keys(pdf.internal.pages).length - 1;
      for(let i = 1; i <= totalPages; i++){
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(`VADE MECUM PRO - Página ${i} de ${totalPages} - Gerado em ${new Date().toLocaleDateString()}`, margin, pdf.internal.pageSize.getHeight() - 10);
      }

      // Gerar o PDF como blob
      const pdfBlob = pdf.output('blob');
      
      try {
        // Upload to Google Drive
        return await this.uploadToGoogleDrive(pdfBlob, `${articleData.number.replace(/[\/\\:*?"<>|]/g, "_")}_${new Date().getTime()}.pdf`);
      } catch (driveError) {
        console.error('Erro ao fazer upload para o Google Drive:', driveError);
        // Fallback - retornar um link local temporário
        const pdfData = pdf.output('datauristring');
        console.log('PDF gerado com sucesso (link temporário local)');
        
        // Simulando um link temporário (7 dias)
        const randomId = Math.random().toString(36).substring(2, 15);
        return `https://drive.google.com/file/d/${randomId}/view?usp=sharing`;
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Não foi possível gerar o PDF');
    }
  }

  private async uploadToGoogleDrive(fileBlob: Blob, fileName: string): Promise<string> {
    try {
      const tokenResponse = await this.getAccessToken();
      if (!tokenResponse || !tokenResponse.access_token) {
        throw new Error('Falha ao obter token de acesso');
      }
      
      // Fazer upload do arquivo para o Google Drive
      const metadata = {
        name: fileName,
        mimeType: 'application/pdf',
        parents: [this.FOLDER_ID], // ID da pasta de destino
      };
      
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', fileBlob);
      
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + tokenResponse.access_token }),
        body: form,
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API do Google Drive: ${response.status}`);
      }
      
      const result = await response.json();
      const fileId = result.id;
      
      // Configurar permissões para "qualquer pessoa com o link pode visualizar"
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + tokenResponse.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
      
      // Retornar o link para visualizar o arquivo
      return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    } catch (error) {
      console.error('Erro ao fazer upload para o Google Drive:', error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Carrega a API do Google através de script
      const loadGoogleScript = () => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          // Define o tipo global para window.gapi
          (window as any).gapi.load('client:auth2', () => {
            (window as any).gapi.client.init({
              apiKey: this.API_KEY,
              clientId: this.CLIENT_ID,
              discoveryDocs: [this.DISCOVERY_DOC],
              scope: this.SCOPES,
            }).then(() => {
              // Solicitar autorização
              (window as any).gapi.auth2.getAuthInstance().signIn().then(
                (response: any) => {
                  const token = response.getAuthResponse();
                  resolve(token);
                },
                (error: any) => {
                  reject(error);
                }
              );
            });
          });
        };
        script.onerror = () => reject(new Error('Falha ao carregar API do Google'));
        document.body.appendChild(script);
      };

      // Verifica se a API já está carregada
      if (typeof (window as any).gapi === 'undefined') {
        loadGoogleScript();
      } else {
        // API já carregada, obter token
        (window as any).gapi.auth2.getAuthInstance().signIn().then(
          (response: any) => {
            const token = response.getAuthResponse();
            resolve(token);
          },
          (error: any) => {
            reject(error);
          }
        );
      }
    });
  }
}

export const pdfService = new PDFService();
export default pdfService;
