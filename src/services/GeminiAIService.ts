
// This is the actual API key provided by the user
const API_KEY = 'AIzaSyDvJ23IolKwjdxAnTv7l8DwLuwGRZ_tIR8';

class GeminiAIService {
  async explainArticle(articleText: string, mode: 'technical' | 'formal' = 'technical'): Promise<string> {
    try {
      let prompt;
      
      if (mode === 'technical') {
        prompt = `Explique o seguinte artigo de lei de forma técnica e detalhada, utilizando terminologia jurídica apropriada:
        
        "${articleText}"
        
        A explicação deve ser abrangente e demonstrar conhecimento jurídico profundo.`;
      } else {
        prompt = `Explique o seguinte artigo de lei de forma simples e acessível para alguém sem conhecimento jurídico, use o formato do tetxo em mardown:
        
        "${articleText}"
        
        Use linguagem cotidiana, exemplos simples e evite termos técnicos. A explicação deve ser compreensível para um leigo.`;
      }

      const response = await this.callGeminiAPI(prompt);
      return response;
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

      const response = await this.callGeminiAPI(prompt);
      return response;
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
      
      Formate as anotações de forma clara e organizada para estudo, devera ser pequena.`;

      const response = await this.callGeminiAPI(prompt);
      return response;
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

      const response = await this.callGeminiAPI(prompt);
      return response;
    } catch (error) {
      console.error('Erro ao responder pergunta:', error);
      throw new Error('Não foi possível responder à pergunta. Tente novamente mais tarde.');
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract text from Gemini response format
      if (data.candidates && 
          data.candidates[0] && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts[0] && 
          data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text;
      }
      
      return "Não foi possível processar a resposta da IA.";
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
}

export const geminiAIService = new GeminiAIService();
export default geminiAIService;
