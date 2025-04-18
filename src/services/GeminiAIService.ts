
import { GoogleGenerativeAI } from '@google/generative-ai';

// This is a placeholder API key. In a production environment, this should be stored securely.
// For demo purposes, we're using a placeholder. You would need to replace this with your actual Gemini API key.
const API_KEY = 'YOUR_GEMINI_API_KEY'; 

class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async explainArticle(articleText: string): Promise<string> {
    try {
      const prompt = `Explique o seguinte artigo de lei de forma detalhada, clara e didática:
      
      "${articleText}"
      
      A explicação deve ser abrangente e facilitar o entendimento, mesmo para pessoas sem formação jurídica.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erro ao gerar explicação do artigo:', error);
      throw new Error('Não foi possível gerar a explicação do artigo. Tente novamente mais tarde.');
    }
  }

  async generateExample(articleText: string): Promise<string> {
    try {
      const prompt = `Com base no seguinte artigo de lei:
      
      "${articleText}"
      
      Gere um exemplo prático e realista da aplicação deste artigo no cotidiano ou em um caso jurídico. O exemplo deve ser detalhado e ilustrar claramente a aplicação da lei.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erro ao gerar exemplo prático:', error);
      throw new Error('Não foi possível gerar o exemplo prático. Tente novamente mais tarde.');
    }
  }

  async generateNotes(articleText: string): Promise<string> {
    try {
      const prompt = `Com base no seguinte artigo de lei:
      
      "${articleText}"
      
      Crie anotações jurídicas úteis que destaquem: 
      1. Principais conceitos
      2. Interpretações relevantes
      3. Conexões com outros artigos ou leis 
      4. Jurisprudências importantes (se aplicável)
      
      Formate as anotações de forma clara e organizada para estudo.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erro ao gerar anotações:', error);
      throw new Error('Não foi possível gerar as anotações. Tente novamente mais tarde.');
    }
  }

  async askQuestion(articleText: string, question: string): Promise<string> {
    try {
      const prompt = `Com base no seguinte artigo de lei:
      
      "${articleText}"
      
      Responda a seguinte pergunta de forma detalhada, completa e didática:
      
      "${question}"`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erro ao responder pergunta:', error);
      throw new Error('Não foi possível responder à pergunta. Tente novamente mais tarde.');
    }
  }
}

export const geminiAIService = new GeminiAIService();
export default geminiAIService;
